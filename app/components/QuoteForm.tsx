"use client";

import type { DeckConfig, PriceBook } from "../lib/types";

type Props = {
  cfg: DeckConfig;
  setCfg: (next: DeckConfig) => void;
  pricebook: PriceBook;
  customer: { name: string; address: string };
  setCustomer: (c: { name: string; address: string }) => void;
};

const sides: ("front" | "back" | "left" | "right")[] = ["front", "back", "left", "right"];

export default function QuoteForm({ cfg, setCfg, pricebook, customer, setCustomer }: Props) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium mb-2">Customer</h3>
        <div className="grid grid-cols-1 gap-2">
          <input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Customer name"
            className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <input
            value={customer.address}
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            placeholder="Job site address"
            className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium mb-2">Dimensions</h3>
        <NumberField
          label="Length"
          unit="m"
          value={cfg.length}
          min={1}
          max={20}
          step={0.1}
          onChange={(v) => setCfg({ ...cfg, length: v })}
        />
        <NumberField
          label="Width"
          unit="m"
          value={cfg.width}
          min={1}
          max={20}
          step={0.1}
          onChange={(v) => setCfg({ ...cfg, width: v })}
        />
        <NumberField
          label="Height off ground"
          unit="m"
          value={cfg.height}
          min={0.1}
          max={3}
          step={0.05}
          onChange={(v) => setCfg({ ...cfg, height: v })}
        />
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium mb-2">Decking material</h3>
        <select
          value={cfg.materialKey}
          onChange={(e) => setCfg({ ...cfg, materialKey: e.target.value })}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
        >
          {Object.entries(pricebook.materials).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label} — ${m.pricePerSqm}/m²
            </option>
          ))}
        </select>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Railing</h3>
          <Toggle checked={cfg.railing} onChange={(v) => setCfg({ ...cfg, railing: v })} />
        </div>
        {cfg.railing && (
          <div className="grid grid-cols-2 gap-1.5">
            {sides.map((s) => {
              const active = cfg.railingSides.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setCfg({
                      ...cfg,
                      railingSides: active ? cfg.railingSides.filter((x) => x !== s) : [...cfg.railingSides, s],
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-md text-xs capitalize border transition-colors ${
                    active
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-200"
                      : "bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Stairs</h3>
          <Toggle checked={cfg.stairs} onChange={(v) => setCfg({ ...cfg, stairs: v })} />
        </div>
        {cfg.stairs && (
          <div className="grid grid-cols-3 gap-1.5">
            {(["front", "left", "right"] as const).map((s) => {
              const active = cfg.stairsSide === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCfg({ ...cfg, stairsSide: s })}
                  className={`px-2.5 py-1.5 rounded-md text-xs capitalize border transition-colors ${
                    active
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-200"
                      : "bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-zinc-300">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            className="w-16 bg-zinc-800/60 border border-zinc-700 rounded-md px-2 py-0.5 text-sm text-right focus:outline-none focus:border-amber-500"
          />
          <span className="text-xs text-zinc-500">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-amber-500" : "bg-zinc-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
