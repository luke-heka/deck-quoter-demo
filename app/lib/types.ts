export type DeckConfig = {
  length: number;
  width: number;
  height: number;
  materialKey: string;
  stairs: boolean;
  stairsSide: "front" | "left" | "right";
  railing: boolean;
  railingSides: ("front" | "back" | "left" | "right")[];
};

export type PriceBook = {
  currency: string;
  materials: Record<string, { label: string; pricePerSqm: number; color: string }>;
  structural: { joistsPerSqm: number; bearersPerSqm: number; postEach: number; footingEach: number };
  extras: { railingPerLinearM: number; stairsPerStep: number; stairTreadRise: number };
  labour: { ratePerSqm: number; stairsFlatFee: number; railingPerLinearM: number };
  margin: number;
  gst: number;
  business: { name: string; tagline: string; email: string; phone: string; abn: string };
};

export type QuoteLine = {
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  margin: number;
  gst: number;
  total: number;
  area: number;
  perimeter: number;
};
