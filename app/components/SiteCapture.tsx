"use client";

import { useEffect, useRef, useState } from "react";
import type { DeckConfig } from "../lib/types";

type Extraction = DeckConfig & { confidence: number; notes: string };

type Props = {
  open: boolean;
  onClose: () => void;
  currentCfg: DeckConfig;
  onApply: (cfg: DeckConfig) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

export default function SiteCapture({ open, onClose, currentCfg, onApply }: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Extraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SR | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRClass = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      setSpeechSupported(false);
      return;
    }
    const rec: SR = new SRClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-AU";
    rec.onresult = (e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setTranscript(full);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
  }, []);

  function toggleRecord() {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
        setRecording(true);
      } catch {
        setRecording(false);
      }
    }
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  async function runExtract() {
    setError(null);
    setExtracting(true);
    try {
      const fd = new FormData();
      if (photo) fd.append("photo", photo);
      if (transcript.trim()) fd.append("transcript", transcript.trim());
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setExtracted(data as Extraction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setExtracting(false);
    }
  }

  function apply() {
    if (!extracted) return;
    const { confidence: _c, notes: _n, ...cfg } = extracted;
    void _c;
    void _n;
    onApply(cfg);
    reset();
    onClose();
  }

  function reset() {
    setPhoto(null);
    setPhotoPreview(null);
    setTranscript("");
    setExtracted(null);
    setError(null);
    setExtracting(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <div>
            <h2 className="font-semibold text-base">Capture from site visit</h2>
            <p className="text-xs text-zinc-500 -mt-0.5">Photo (optional) + voice note → AI extracts the deck spec.</p>
          </div>
          <button type="button" onClick={() => { reset(); onClose(); }} className="text-zinc-500 hover:text-zinc-200 p-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M14.7 5.3a1 1 0 0 0-1.4 0L10 8.6 6.7 5.3a1 1 0 0 0-1.4 1.4L8.6 10l-3.3 3.3a1 1 0 1 0 1.4 1.4L10 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11.4 10l3.3-3.3a1 1 0 0 0 0-1.4z"/></svg>
          </button>
        </div>

        {!extracted ? (
          <div className="p-5 space-y-5">
            <section>
              <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-2">1. Site photo (optional)</h3>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhotoChange}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-amber-500/60 cursor-pointer transition-colors">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="site" className="w-full h-48 object-cover rounded-lg" />
                  ) : (
                    <div className="text-center py-6 text-zinc-500">
                      <div className="text-3xl mb-1">📷</div>
                      <div className="text-sm">Tap to open camera or pick a photo</div>
                      <div className="text-xs text-zinc-600 mt-1">Slab, lawn, existing decking area</div>
                    </div>
                  )}
                </div>
              </label>
            </section>

            <section>
              <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-2">2. Voice note — say the measurements</h3>
              {speechSupported ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={toggleRecord}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                      recording ? "bg-red-500/20 border border-red-500/60 text-red-300" : "bg-zinc-800 border border-zinc-700 text-zinc-200 hover:border-amber-500/60"
                    }`}
                  >
                    {recording ? "🎙 Recording — tap to stop" : "🎙 Tap to record"}
                  </button>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="e.g. four meters by six meters, ninety centimeters off the ground, spotted gum, stairs at the front, railing on three sides"
                    rows={3}
                    className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-xs text-zinc-500">Transcript appears above — edit if anything was misheard.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                    Voice recording not supported in this browser — type the measurements below.
                  </div>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="e.g. 4 by 6 metres, 900mm off the ground, spotted gum, stairs at the front, railing on three sides"
                    rows={4}
                    className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </section>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
            )}

            <button
              type="button"
              onClick={runExtract}
              disabled={extracting || (!photo && !transcript.trim())}
              className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {extracting ? "Extracting with Claude…" : "Extract deck spec"}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <ConfidencePill confidence={extracted.confidence} />
            <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Claude&apos;s notes</div>
              <div className="text-sm text-zinc-200">{extracted.notes}</div>
            </div>

            <section>
              <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-2">Review extracted spec</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-zinc-800/40 border border-zinc-700 rounded-xl p-4">
                <Diff label="Length" before={`${currentCfg.length} m`} after={`${extracted.length} m`} />
                <Diff label="Width" before={`${currentCfg.width} m`} after={`${extracted.width} m`} />
                <Diff label="Height" before={`${currentCfg.height} m`} after={`${extracted.height} m`} />
                <Diff label="Material" before={currentCfg.materialKey} after={extracted.materialKey} />
                <Diff
                  label="Stairs"
                  before={currentCfg.stairs ? currentCfg.stairsSide : "no"}
                  after={extracted.stairs ? extracted.stairsSide : "no"}
                />
                <Diff
                  label="Railing"
                  before={currentCfg.railing ? currentCfg.railingSides.join(", ") || "—" : "no"}
                  after={extracted.railing ? extracted.railingSides.join(", ") || "—" : "no"}
                />
              </div>
            </section>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExtracted(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium"
              >
                Back / try again
              </button>
              <button
                type="button"
                onClick={apply}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold"
              >
                Apply to form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.8
      ? { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-300", label: "High confidence" }
      : confidence >= 0.6
        ? { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-300", label: "Medium — review carefully" }
        : { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-300", label: "Low — verify everything" };
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${color.bg} ${color.border}`}>
      <span className={`text-sm font-medium ${color.text}`}>{color.label}</span>
      <span className={`text-sm font-semibold ${color.text}`}>{pct}%</span>
    </div>
  );
}

function Diff({ label, before, after }: { label: string; before: string; after: string }) {
  const changed = before !== after;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="flex items-center gap-2 text-sm">
        {changed ? (
          <>
            <span className="text-zinc-500 line-through">{before}</span>
            <span className="text-zinc-600">→</span>
            <span className="text-amber-300 font-medium">{after}</span>
          </>
        ) : (
          <span className="text-zinc-300">{after}</span>
        )}
      </div>
    </div>
  );
}
