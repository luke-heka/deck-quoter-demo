"use client";

import { fmtMoney } from "../lib/pricing";
import type { Quote, PriceBook } from "../lib/types";

export default function QuoteSummary({ quote, pricebook }: { quote: Quote; pricebook: PriceBook }) {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm uppercase tracking-wider text-zinc-400">Live quote</h2>
        <div className="text-xs text-zinc-500">
          {quote.area} m² · {quote.perimeter} lin m perimeter
        </div>
      </div>

      <div className="space-y-1 mb-4 max-h-72 overflow-y-auto pr-1">
        {quote.lines.map((line, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-zinc-800/60 last:border-b-0">
            <div className="flex-1 truncate text-zinc-300">{line.label}</div>
            <div className="text-zinc-500 text-xs w-24 text-right tabular-nums">
              {line.qty} {line.unit}
            </div>
            <div className="w-24 text-right tabular-nums text-zinc-200">{fmtMoney(line.total, pricebook.currency)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-3 border-t border-zinc-800">
        <Row label="Subtotal" value={fmtMoney(quote.subtotal, pricebook.currency)} />
        <Row label={`Margin (${Math.round(pricebook.margin * 100)}%)`} value={fmtMoney(quote.margin, pricebook.currency)} />
        <Row label={`GST (${Math.round(pricebook.gst * 100)}%)`} value={fmtMoney(quote.gst, pricebook.currency)} />
        <div className="flex justify-between items-baseline pt-2">
          <div className="text-zinc-400 text-sm">Total inc. GST</div>
          <div className="text-2xl font-semibold text-amber-400 tabular-nums">{fmtMoney(quote.total, pricebook.currency)}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <div className="text-zinc-400">{label}</div>
      <div className="tabular-nums text-zinc-300">{value}</div>
    </div>
  );
}
