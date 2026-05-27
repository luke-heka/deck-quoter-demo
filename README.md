# Deck Quoter — 3D quotes on the spot

Workshop demo template by Selr AI. Type deck measurements → see a real 3D model rotate in the browser → download a branded PDF quote with the render baked in.

Designed so a builder, landscaper, fencer, or pergola installer can clone, swap their prices and logo, and use it on a tablet on the job site.

## What it does (right now — Phase 1)

- Live parametric 3D deck (boards, joists, posts, railing, stairs) — drag to rotate, scroll to zoom
- Length / width / height / material / stairs / railing form, updates in real time
- Live pricing engine: materials + labour + project loading + GST
- Branded PDF download with the 3D render + spec table + itemised quote
- Hardcoded pricebook in `app/lib/pricebook.json` — edit your prices in 30 sec

## What's next (Phase 2 / Phase 3)

- Upload a site photo + voice note → AI extracts dimensions (with a builder review/edit step)
- Admin UI for the pricebook (auth + Supabase, no JSON editing)
- AI photoreal "beauty shot" via Nano Banana to pair with the parametric render

## Local dev

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

## Swap your prices and branding

Edit `app/lib/pricebook.json`:

- `business.name`, `business.email`, `business.phone`, `business.abn` — top of every PDF
- `materials` — your decking products and per-m² prices
- `structural`, `labour`, `extras` — your rates
- `margin`, `gst` — project loading and tax

Save the file, refresh the page. Done.

## Deploy your own

1. Fork this repo to your own GitHub.
2. In Vercel, import the repo and deploy. No env vars needed for Phase 1.
3. Send the URL to your tablet.

## Tech

- Next.js 16 + React 19 (App Router, Turbopack)
- Three.js + react-three-fiber + drei (3D)
- Tailwind v4 (styling)
- @react-pdf/renderer (PDF generation, client-side)
- Deploys to Vercel

## License

MIT. Built by Selr AI as a workshop reference build.
