import type { DeckConfig, PriceBook, Quote, QuoteLine } from "./types";

export function calcQuote(cfg: DeckConfig, pb: PriceBook): Quote {
  const area = cfg.length * cfg.width;
  const perimeter = 2 * (cfg.length + cfg.width);
  const railLen = cfg.railing
    ? cfg.railingSides.reduce((sum, s) => sum + (s === "front" || s === "back" ? cfg.length : cfg.width), 0)
    : 0;
  const stepCount = cfg.stairs ? Math.max(1, Math.ceil(cfg.height / pb.extras.stairTreadRise)) : 0;

  const postCount = Math.max(4, Math.ceil((cfg.length / 1.8 + 1) * (cfg.width / 1.8 + 1)));

  const material = pb.materials[cfg.materialKey];
  const lines: QuoteLine[] = [
    { label: `Decking — ${material.label}`, qty: round2(area), unit: "m²", unitPrice: material.pricePerSqm, total: round2(area * material.pricePerSqm) },
    { label: "Joists (90×45 H3, 450mm centres)", qty: round2(area), unit: "m²", unitPrice: pb.structural.joistsPerSqm, total: round2(area * pb.structural.joistsPerSqm) },
    { label: "Bearers (140×45 H3)", qty: round2(area), unit: "m²", unitPrice: pb.structural.bearersPerSqm, total: round2(area * pb.structural.bearersPerSqm) },
    { label: "Posts (90×90 hardwood)", qty: postCount, unit: "ea", unitPrice: pb.structural.postEach, total: round2(postCount * pb.structural.postEach) },
    { label: "Footings (concrete pads)", qty: postCount, unit: "ea", unitPrice: pb.structural.footingEach, total: round2(postCount * pb.structural.footingEach) },
  ];

  if (cfg.railing && railLen > 0) {
    lines.push({ label: "Railing (top rail + balusters)", qty: round2(railLen), unit: "lin m", unitPrice: pb.extras.railingPerLinearM, total: round2(railLen * pb.extras.railingPerLinearM) });
  }

  if (cfg.stairs && stepCount > 0) {
    lines.push({ label: `Stairs (${stepCount} step${stepCount > 1 ? "s" : ""})`, qty: stepCount, unit: "step", unitPrice: pb.extras.stairsPerStep, total: round2(stepCount * pb.extras.stairsPerStep) });
  }

  lines.push({ label: "Labour — frame, fix, finish", qty: round2(area), unit: "m²", unitPrice: pb.labour.ratePerSqm, total: round2(area * pb.labour.ratePerSqm) });

  if (cfg.railing && railLen > 0) {
    lines.push({ label: "Labour — railing", qty: round2(railLen), unit: "lin m", unitPrice: pb.labour.railingPerLinearM, total: round2(railLen * pb.labour.railingPerLinearM) });
  }

  if (cfg.stairs && stepCount > 0) {
    lines.push({ label: "Labour — stairs", qty: 1, unit: "job", unitPrice: pb.labour.stairsFlatFee, total: pb.labour.stairsFlatFee });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const margin = round2(subtotal * pb.margin);
  const beforeGst = subtotal + margin;
  const gst = round2(beforeGst * pb.gst);
  const total = round2(beforeGst + gst);

  return { lines, subtotal, margin, gst, total, area: round2(area), perimeter: round2(perimeter) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmtMoney(n: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}
