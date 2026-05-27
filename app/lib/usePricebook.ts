"use client";

import { useEffect, useState, useCallback } from "react";
import defaultPricebook from "./pricebook.json";
import type { PriceBook } from "./types";

const STORAGE_KEY = "deck-quoter-pricebook-v1";
const LOGO_KEY = "deck-quoter-logo-v1";

export function usePricebook() {
  const [pricebook, setPricebook] = useState<PriceBook>(defaultPricebook as PriceBook);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PriceBook;
        setPricebook(parsed);
      }
      const logo = localStorage.getItem(LOGO_KEY);
      if (logo) setLogoDataUrl(logo);
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  const update = useCallback((next: PriceBook) => {
    setPricebook(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota or private mode
    }
  }, []);

  const updateLogo = useCallback((dataUrl: string | null) => {
    setLogoDataUrl(dataUrl);
    try {
      if (dataUrl) localStorage.setItem(LOGO_KEY, dataUrl);
      else localStorage.removeItem(LOGO_KEY);
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    const fresh = defaultPricebook as PriceBook;
    setPricebook(fresh);
    setLogoDataUrl(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LOGO_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { pricebook, logoDataUrl, hydrated, update, updateLogo, reset };
}
