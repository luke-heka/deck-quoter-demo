"use client";

import { useRef, useState } from "react";
import type { PriceBook } from "../lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  pricebook: PriceBook;
  logoDataUrl: string | null;
  onUpdate: (next: PriceBook) => void;
  onUpdateLogo: (dataUrl: string | null) => void;
  onReset: () => void;
};

type Tab = "business" | "materials" | "structural" | "labour";

export default function SettingsModal({ open, onClose, pricebook, logoDataUrl, onUpdate, onUpdateLogo, onReset }: Props) {
  const [tab, setTab] = useState<Tab>("business");
  const importRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function setField<K extends keyof PriceBook>(key: K, value: PriceBook[K]) {
    onUpdate({ ...pricebook, [key]: value });
  }

  function updateBusiness(patch: Partial<PriceBook["business"]>) {
    onUpdate({ ...pricebook, business: { ...pricebook.business, ...patch } });
  }

  function updateMaterial(key: string, patch: Partial<PriceBook["materials"][string]>) {
    onUpdate({
      ...pricebook,
      materials: { ...pricebook.materials, [key]: { ...pricebook.materials[key], ...patch } },
    });
  }

  function deleteMaterial(key: string) {
    const next = { ...pricebook.materials };
    delete next[key];
    onUpdate({ ...pricebook, materials: next });
  }

  function addMaterial() {
    const slug = `material-${Object.keys(pricebook.materials).length + 1}`;
    onUpdate({
      ...pricebook,
      materials: {
        ...pricebook.materials,
        [slug]: { label: "New material", pricePerSqm: 100, color: "#8a5a3c" },
      },
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(pricebook, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pricebook.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as PriceBook;
        onUpdate(parsed);
      } catch {
        alert("That file isn't a valid pricebook JSON.");
      }
    };
    reader.readAsText(file);
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdateLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="font-semibold text-base">Settings</h2>
            <p className="text-xs text-zinc-500 -mt-0.5">Saved to this browser. Export the JSON to keep it across devices.</p>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            title="Close"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M14.7 5.3a1 1 0 0 0-1.4 0L10 8.6 6.7 5.3a1 1 0 0 0-1.4 1.4L8.6 10l-3.3 3.3a1 1 0 1 0 1.4 1.4L10 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11.4 10l3.3-3.3a1 1 0 0 0 0-1.4z"/></svg>
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-zinc-800">
          {(["business", "materials", "structural", "labour"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${
                tab === t ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === "business" && (
            <div className="space-y-3 max-w-xl">
              <Field label="Business name" value={pricebook.business.name} onChange={(v) => updateBusiness({ name: v })} />
              <Field label="Tagline" value={pricebook.business.tagline} onChange={(v) => updateBusiness({ tagline: v })} />
              <Field label="Email" value={pricebook.business.email} onChange={(v) => updateBusiness({ email: v })} />
              <Field label="Phone" value={pricebook.business.phone} onChange={(v) => updateBusiness({ phone: v })} />
              <Field label="ABN" value={pricebook.business.abn} onChange={(v) => updateBusiness({ abn: v })} />
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Logo (optional)</label>
                <div className="flex items-center gap-3">
                  {logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoDataUrl} alt="logo" className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">none</div>
                  )}
                  <label className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm cursor-pointer hover:border-amber-500/60">
                    <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                    Upload logo
                  </label>
                  {logoDataUrl && (
                    <button type="button" onClick={() => onUpdateLogo(null)} className="text-xs text-red-300 hover:text-red-200">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "materials" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-zinc-400">Decking products and per-m² prices.</p>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="px-3 py-1.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/25"
                >
                  + Add material
                </button>
              </div>
              {Object.entries(pricebook.materials).map(([key, m]) => (
                <div key={key} className="bg-zinc-800/40 border border-zinc-700 rounded-lg p-3 grid grid-cols-[1fr_120px_60px_auto] gap-2 items-center">
                  <input
                    aria-label="Material name"
                    title="Material name"
                    placeholder="Material name"
                    value={m.label}
                    onChange={(e) => updateMaterial(key, { label: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 text-xs">$</span>
                    <input
                      aria-label="Price per square metre"
                      title="Price per m²"
                      type="number"
                      value={m.pricePerSqm}
                      onChange={(e) => updateMaterial(key, { pricePerSqm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm text-right tabular-nums"
                    />
                    <span className="text-zinc-500 text-xs">/m²</span>
                  </div>
                  <input
                    aria-label="Material colour swatch"
                    title="Render colour"
                    type="color"
                    value={m.color}
                    onChange={(e) => updateMaterial(key, { color: e.target.value })}
                    className="w-full h-7 rounded cursor-pointer"
                  />
                  <button
                    type="button"
                    aria-label="Delete material"
                    title="Delete material"
                    onClick={() => deleteMaterial(key)}
                    className="text-zinc-500 hover:text-red-300 text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "structural" && (
            <div className="space-y-3 max-w-md">
              <NumField label="Joists" suffix="/m²" value={pricebook.structural.joistsPerSqm}
                onChange={(v) => setField("structural", { ...pricebook.structural, joistsPerSqm: v })} />
              <NumField label="Bearers" suffix="/m²" value={pricebook.structural.bearersPerSqm}
                onChange={(v) => setField("structural", { ...pricebook.structural, bearersPerSqm: v })} />
              <NumField label="Post" suffix="ea" value={pricebook.structural.postEach}
                onChange={(v) => setField("structural", { ...pricebook.structural, postEach: v })} />
              <NumField label="Footing" suffix="ea" value={pricebook.structural.footingEach}
                onChange={(v) => setField("structural", { ...pricebook.structural, footingEach: v })} />
              <NumField label="Railing materials" suffix="/lin m" value={pricebook.extras.railingPerLinearM}
                onChange={(v) => setField("extras", { ...pricebook.extras, railingPerLinearM: v })} />
              <NumField label="Stair materials" suffix="/step" value={pricebook.extras.stairsPerStep}
                onChange={(v) => setField("extras", { ...pricebook.extras, stairsPerStep: v })} />
            </div>
          )}

          {tab === "labour" && (
            <div className="space-y-3 max-w-md">
              <NumField label="Frame, fix, finish" suffix="/m²" value={pricebook.labour.ratePerSqm}
                onChange={(v) => setField("labour", { ...pricebook.labour, ratePerSqm: v })} />
              <NumField label="Railing labour" suffix="/lin m" value={pricebook.labour.railingPerLinearM}
                onChange={(v) => setField("labour", { ...pricebook.labour, railingPerLinearM: v })} />
              <NumField label="Stairs labour" suffix="flat" value={pricebook.labour.stairsFlatFee}
                onChange={(v) => setField("labour", { ...pricebook.labour, stairsFlatFee: v })} />
              <div className="border-t border-zinc-800 pt-3 mt-3">
                <NumField label="Project loading" suffix="%" value={Math.round(pricebook.margin * 100)}
                  onChange={(v) => setField("margin", v / 100)} />
                <NumField label="GST" suffix="%" value={Math.round(pricebook.gst * 100)}
                  onChange={(v) => setField("gst", v / 100)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 p-4 border-t border-zinc-800 bg-zinc-900/80">
          <button
            type="button"
            onClick={exportJson}
            className="px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm hover:border-amber-500/60"
          >
            Export pricebook.json
          </button>
          <input
            ref={importRef}
            aria-label="Import pricebook JSON"
            title="Import pricebook.json"
            type="file"
            accept="application/json"
            onChange={importJson}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm hover:border-amber-500/60"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={() => { if (confirm("Reset to defaults? This wipes your saved settings.")) onReset(); }}
            className="px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-red-300 hover:border-red-500/60 ml-auto"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">{label}</span>
      <input
        aria-label={label}
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
      />
    </label>
  );
}

function NumField({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-zinc-300 flex-1">{label}</span>
      <div className="flex items-center gap-1 w-40">
        <input
          aria-label={`${label} ${suffix}`}
          title={`${label} (${suffix})`}
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-md px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:border-amber-500"
        />
        <span className="text-xs text-zinc-500 w-12">{suffix}</span>
      </div>
    </label>
  );
}
