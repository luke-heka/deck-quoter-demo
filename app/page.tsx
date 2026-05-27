"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import QuoteForm from "./components/QuoteForm";
import QuoteSummary from "./components/QuoteSummary";
import SiteCapture from "./components/SiteCapture";
import SettingsModal from "./components/SettingsModal";
import { usePricebook } from "./lib/usePricebook";
import { calcQuote, fmtMoney } from "./lib/pricing";
import type { DeckConfig } from "./lib/types";

const DeckScene = dynamic(() => import("./components/DeckScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">Loading 3D engine…</div>
  ),
});

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
  const { pricebook, logoDataUrl, hydrated, update, updateLogo, reset } = usePricebook();
  const [cfg, setCfg] = useState<DeckConfig>(initialCfg);
  const [customer, setCustomer] = useState({ name: "", address: "" });
  const [generating, setGenerating] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Snap material key back into a valid one when the pricebook changes
  useEffect(() => {
    if (!hydrated) return;
    if (!pricebook.materials[cfg.materialKey]) {
      const first = Object.keys(pricebook.materials)[0];
      if (first) setCfg({ ...cfg, materialKey: first });
    }
  }, [hydrated, pricebook, cfg]);

  const quote = useMemo(() => calcQuote(cfg, pricebook), [cfg, pricebook]);

  async function handleDownload() {
    setGenerating(true);
    try {
      const canvas = sceneRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
      const renderDataUrl = canvas ? canvas.toDataURL("image/png") : undefined;
      const { pdf } = await import("@react-pdf/renderer");
      const { default: QuotePDF } = await import("./components/QuotePDF");
      const blob = await pdf(
        <QuotePDF
          cfg={cfg}
          quote={quote}
          pricebook={pricebook}
          customer={customer}
          renderDataUrl={renderDataUrl}
          logoDataUrl={logoDataUrl ?? undefined}
        />,
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
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="logo" className="w-8 h-8 rounded-lg object-cover bg-zinc-800" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-zinc-950 font-bold text-sm">D</span>
              </div>
            )}
            <div>
              <div className="font-semibold text-sm tracking-tight">{pricebook.business.name}</div>
              <div className="text-xs text-zinc-500 -mt-0.5">{pricebook.business.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right mr-1">
              <div className="text-xs text-zinc-500">Live quote</div>
              <div className="text-base font-semibold text-amber-400 tabular-nums -mt-0.5">{fmtMoney(quote.total, pricebook.currency)}</div>
            </div>
            <button
              type="button"
              aria-label="Settings"
              title="Settings"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm6.7 3.2-1.4-.4a5 5 0 0 0-.5-1.3l.7-1.3a.5.5 0 0 0-.1-.6L14 4.6a.5.5 0 0 0-.6-.1L12 5.2a5 5 0 0 0-1.3-.5L10.3 3.3a.5.5 0 0 0-.5-.4H9a.5.5 0 0 0-.5.4l-.4 1.4a5 5 0 0 0-1.3.5L5.5 4.5a.5.5 0 0 0-.6.1L3.5 7a.5.5 0 0 0-.1.6l.7 1.3a5 5 0 0 0-.5 1.3L3.2 10.5a.5.5 0 0 0-.4.5v.8c0 .2.2.4.4.5l1.4.4a5 5 0 0 0 .5 1.3l-.7 1.3a.5.5 0 0 0 .1.6L5.9 17a.5.5 0 0 0 .6.1l1.3-.7a5 5 0 0 0 1.3.5l.4 1.4c0 .2.3.4.5.4h.8c.2 0 .4-.2.5-.4l.4-1.4a5 5 0 0 0 1.3-.5l1.3.7a.5.5 0 0 0 .6-.1l1.4-1.4a.5.5 0 0 0 .1-.6l-.7-1.3a5 5 0 0 0 .5-1.3l1.4-.4a.5.5 0 0 0 .4-.5v-.8a.5.5 0 0 0-.4-.5z"/></svg>
            </button>
            <button
              type="button"
              onClick={() => setCaptureOpen(true)}
              className="hidden sm:inline-flex px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium transition-colors items-center gap-1.5"
            >
              <span>📷</span> Capture
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating…" : "Download PDF"}
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
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setCaptureOpen(true)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>📷</span> Capture from site
            </button>
          </div>
          <div className="text-xs text-zinc-600 text-center pb-2">
            Drag to rotate · scroll to zoom · prices update instantly · workshop demo by{" "}
            <a href="https://selr.ai" className="text-zinc-500 hover:text-amber-400">
              Selr AI
            </a>
          </div>
        </section>
      </div>

      <SiteCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        currentCfg={cfg}
        pricebook={pricebook}
        onApply={(next) => setCfg(next)}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        pricebook={pricebook}
        logoDataUrl={logoDataUrl}
        onUpdate={update}
        onUpdateLogo={updateLogo}
        onReset={reset}
      />
    </main>
  );
}
