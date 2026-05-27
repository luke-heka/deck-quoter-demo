"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import QuoteForm from "./components/QuoteForm";
import QuoteSummary from "./components/QuoteSummary";
import pricebookJson from "./lib/pricebook.json";
import { calcQuote, fmtMoney } from "./lib/pricing";
import type { DeckConfig, PriceBook } from "./lib/types";

const DeckScene = dynamic(() => import("./components/DeckScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">Loading 3D engine…</div>
  ),
});

const pricebook = pricebookJson as PriceBook;

const initialCfg: DeckConfig = {
  length: 6,
  width: 4,
  height: 0.9,
  materialKey: "spotted-gum",
  stairs: true,
  stairsSide: "front",
  railing: true,
  railingSides: ["front", "left", "right"],
};

export default function Home() {
  const [cfg, setCfg] = useState<DeckConfig>(initialCfg);
  const [customer, setCustomer] = useState({ name: "", address: "" });
  const [generating, setGenerating] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  const quote = useMemo(() => calcQuote(cfg, pricebook), [cfg]);

  async function handleDownload() {
    setGenerating(true);
    try {
      const canvas = sceneRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
      const renderDataUrl = canvas ? canvas.toDataURL("image/png") : undefined;
      const { pdf } = await import("@react-pdf/renderer");
      const { default: QuotePDF } = await import("./components/QuotePDF");
      const blob = await pdf(
        <QuotePDF cfg={cfg} quote={quote} pricebook={pricebook} customer={customer} renderDataUrl={renderDataUrl} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (customer.name || "deck-quote").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-sm">D</span>
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight">{pricebook.business.name}</div>
              <div className="text-xs text-zinc-500 -mt-0.5">{pricebook.business.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-xs text-zinc-500">Live quote</div>
              <div className="text-base font-semibold text-amber-400 tabular-nums -mt-0.5">{fmtMoney(quote.total, pricebook.currency)}</div>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating…" : "Download Quote PDF"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <aside className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 lg:sticky lg:top-[72px] lg:self-start lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto">
          <QuoteForm
            cfg={cfg}
            setCfg={setCfg}
            pricebook={pricebook}
            customer={customer}
            setCustomer={setCustomer}
          />
        </aside>

        <section className="space-y-5">
          <div
            ref={sceneRef}
            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden aspect-[16/10] lg:aspect-[16/9]"
          >
            <DeckScene cfg={cfg} pricebook={pricebook} />
          </div>
          <QuoteSummary quote={quote} pricebook={pricebook} />
          <div className="text-xs text-zinc-600 text-center pb-2">
            Drag to rotate · scroll to zoom · prices update instantly · workshop demo by{" "}
            <a href="https://selr.ai" className="text-zinc-500 hover:text-amber-400">
              Selr AI
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
