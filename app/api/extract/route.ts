import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const SIDES = ["front", "back", "left", "right"] as const;
const STAIR_SIDES = ["front", "left", "right"] as const;

const baseSchema = z.object({
  length: z.number().min(0.5).max(20),
  width: z.number().min(0.5).max(20),
  height: z.number().min(0.05).max(3),
  materialKey: z.string(),
  stairs: z.boolean(),
  stairsSide: z.enum(STAIR_SIDES),
  railing: z.boolean(),
  railingSides: z.array(z.enum(SIDES)),
  confidence: z.number().min(0).max(1),
  notes: z.string(),
});

function buildSystemPrompt(materials: { key: string; label: string }[]) {
  const materialList = materials.length
    ? materials.map((m) => `  - "${m.key}" → ${m.label}`).join("\n")
    : '  - "spotted-gum" → Spotted Gum';
  const defaultKey = materials[0]?.key ?? "spotted-gum";
  return `You are a deck quoting assistant for an Australian builder.
You extract deck specifications from a transcribed voice note and an optional site photo.

The voice note is the PRIMARY source of measurements. The photo is context only — it tells you about the site, existing materials, and style preferences. NEVER infer dimensions from the photo (perspective makes it unreliable).

Rules:
- Length and width are in METRES. Height (off the ground) is in METRES (convert cm: 90cm = 0.9m).
- If the builder uses imperial units, convert to metres (1 ft = 0.305 m).
- If the builder says "high" without a number, assume 0.9 m. If they say "low-set", assume 0.4 m.
- materialKey MUST be one of these exact keys (left of arrow):
${materialList}
- If material isn't mentioned, default to "${defaultKey}". If the builder names a material not in the list, pick the closest match by description.
- stairsSide MUST be one of: front, left, right (default: front).
- railingSides is an array — only include sides if railing is true. Default to ["front", "left", "right"] (handrail on the open sides, not the house side).
- If the builder mentions the deck attaches to the house, the "back" side is the house side — exclude it from railingSides.
- confidence is your 0-1 self-rating of how clear the spec was. Below 0.6 means the builder should review carefully.
- notes is a short plain-English summary of what you heard and any ambiguities you resolved (max 2 sentences).

Return ONLY a single JSON object, no prose, no markdown fences. Schema:
{
  "length": number,
  "width": number,
  "height": number,
  "materialKey": string,
  "stairs": boolean,
  "stairsSide": string,
  "railing": boolean,
  "railingSides": string[],
  "confidence": number,
  "notes": string
}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Set it in Vercel project settings → Environment Variables." },
      { status: 503 },
    );
  }

  try {
    const form = await req.formData();
    const transcript = (form.get("transcript") as string | null) ?? "";
    const photo = form.get("photo") as File | null;
    const materialsJson = (form.get("materials") as string | null) ?? "[]";
    let materials: { key: string; label: string }[] = [];
    try {
      const parsed = JSON.parse(materialsJson);
      if (Array.isArray(parsed)) materials = parsed.slice(0, 30);
    } catch {
      // ignore, leave empty
    }

    if (!transcript && !photo) {
      return NextResponse.json({ error: "Provide a voice note transcript or a photo." }, { status: 400 });
    }

    const userBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    if (photo) {
      const buf = Buffer.from(await photo.arrayBuffer());
      const mediaType = (photo.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      userBlocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: buf.toString("base64") },
      });
    }

    userBlocks.push({
      type: "text",
      text: transcript
        ? `Builder's voice note (transcribed): "${transcript}"\n\nExtract the deck spec. Return JSON only.`
        : "No voice note provided. Make best-effort assumptions from the photo only and set confidence below 0.5. Return JSON only.",
    });

    const client = new Anthropic();
    const systemPrompt = buildSystemPrompt(materials);
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userBlocks }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Model returned no text." }, { status: 502 });
    }

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Model did not return JSON.", raw }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Failed to parse JSON from model.", raw }, { status: 502 });
    }

    const validated = baseSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Extracted data failed validation.", details: validated.error.flatten(), raw: parsed },
        { status: 502 },
      );
    }

    if (materials.length > 0 && !materials.some((m) => m.key === validated.data.materialKey)) {
      validated.data.materialKey = materials[0].key;
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
