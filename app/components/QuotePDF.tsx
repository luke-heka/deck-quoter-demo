"use client";

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DeckConfig, PriceBook, Quote } from "../lib/types";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 36, fontSize: 10, color: "#222" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, borderBottomWidth: 2, borderBottomColor: "#d4a017", paddingBottom: 12 },
  brand: { fontSize: 18, fontWeight: 700, color: "#1a1a1a" },
  tagline: { fontSize: 9, color: "#888", marginTop: 2 },
  contact: { fontSize: 9, color: "#555", textAlign: "right", lineHeight: 1.4 },
  sectionLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  customer: { marginBottom: 14 },
  customerName: { fontSize: 13, fontWeight: 700, color: "#1a1a1a" },
  meta: { fontSize: 9, color: "#666", marginTop: 2 },
  renderBox: { marginBottom: 14, borderRadius: 4, overflow: "hidden" },
  renderImg: { width: "100%", height: 220, objectFit: "cover" },
  specsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 16, padding: 10, backgroundColor: "#f6f4ed", borderRadius: 4 },
  spec: { flexDirection: "column", minWidth: 80 },
  specLabel: { fontSize: 7, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  specValue: { fontSize: 11, color: "#1a1a1a", marginTop: 2 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d4a017", paddingBottom: 4, marginBottom: 4 },
  th: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  thItem: { flex: 4 },
  thQty: { flex: 1.2, textAlign: "right" },
  thUnit: { flex: 1, textAlign: "right" },
  thTotal: { flex: 1.4, textAlign: "right" },
  tr: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  td: { fontSize: 9, color: "#333" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalLabel: { fontSize: 9, color: "#555" },
  totalValue: { fontSize: 9, color: "#222" },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTopWidth: 2, borderTopColor: "#d4a017" },
  grandLabel: { fontSize: 11, fontWeight: 700, color: "#1a1a1a" },
  grandValue: { fontSize: 14, fontWeight: 700, color: "#d4a017" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#999", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#ddd", paddingTop: 6 },
  note: { fontSize: 8, color: "#888", marginTop: 14, fontStyle: "italic", lineHeight: 1.5 },
});

function fmt(n: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

const today = () => new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

export default function QuotePDF({
  cfg,
  quote,
  pricebook,
  customer,
  renderDataUrl,
  logoDataUrl,
}: {
  cfg: DeckConfig;
  quote: Quote;
  pricebook: PriceBook;
  customer: { name: string; address: string };
  renderDataUrl?: string;
  logoDataUrl?: string;
}) {
  const material = pricebook.materials[cfg.materialKey];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {logoDataUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoDataUrl} style={{ width: 36, height: 36, borderRadius: 4 }} />
            )}
            <View>
              <Text style={styles.brand}>{pricebook.business.name}</Text>
              <Text style={styles.tagline}>{pricebook.business.tagline}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.contact}>{pricebook.business.email}</Text>
            <Text style={styles.contact}>{pricebook.business.phone}</Text>
            <Text style={styles.contact}>ABN {pricebook.business.abn}</Text>
          </View>
        </View>

        <View style={styles.customer}>
          <Text style={styles.sectionLabel}>Quote prepared for</Text>
          <Text style={styles.customerName}>{customer.name || "—"}</Text>
          <Text style={styles.meta}>{customer.address || "—"}</Text>
          <Text style={styles.meta}>Date issued: {today()}  ·  Valid 30 days</Text>
        </View>

        {renderDataUrl && (
          <View style={styles.renderBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={renderDataUrl} style={styles.renderImg} />
          </View>
        )}

        <View style={styles.specsRow}>
          <Spec label="Length" value={`${cfg.length} m`} />
          <Spec label="Width" value={`${cfg.width} m`} />
          <Spec label="Area" value={`${quote.area} m²`} />
          <Spec label="Height" value={`${cfg.height} m`} />
          <Spec label="Material" value={material.label} />
          <Spec label="Railing" value={cfg.railing ? cfg.railingSides.join(", ") || "—" : "no"} />
          <Spec label="Stairs" value={cfg.stairs ? cfg.stairsSide : "no"} />
        </View>

        <Text style={styles.sectionLabel}>Itemised quote</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thItem]}>Item</Text>
          <Text style={[styles.th, styles.thQty]}>Qty</Text>
          <Text style={[styles.th, styles.thUnit]}>Unit</Text>
          <Text style={[styles.th, styles.thTotal]}>Total</Text>
        </View>
        {quote.lines.map((line, i) => (
          <View key={i} style={styles.tr}>
            <Text style={[styles.td, styles.thItem]}>{line.label}</Text>
            <Text style={[styles.td, styles.thQty]}>{line.qty}</Text>
            <Text style={[styles.td, styles.thUnit]}>{line.unit}</Text>
            <Text style={[styles.td, styles.thTotal]}>{fmt(line.total, pricebook.currency)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(quote.subtotal, pricebook.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Project loading ({Math.round(pricebook.margin * 100)}%)</Text>
            <Text style={styles.totalValue}>{fmt(quote.margin, pricebook.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST ({Math.round(pricebook.gst * 100)}%)</Text>
            <Text style={styles.totalValue}>{fmt(quote.gst, pricebook.currency)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total inc. GST</Text>
            <Text style={styles.grandValue}>{fmt(quote.total, pricebook.currency)}</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Quote based on the dimensions and materials shown above and assumes a flat, accessible site with standard
          footings. Final price subject to site inspection. Acceptance by reply email or signed copy. Payment terms:
          30% deposit on acceptance, 40% on frame complete, 30% on practical completion.
        </Text>

        <Text style={styles.footer}>
          {pricebook.business.name} · {pricebook.business.email} · ABN {pricebook.business.abn} · 3D render generated by Selr AI deck-quoter
        </Text>
      </Page>
    </Document>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}
