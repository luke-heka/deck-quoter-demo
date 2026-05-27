# Deck Quoter — 3D quotes on the spot

Workshop template by Selr AI. Type deck measurements (or capture them with a site photo + voice note), see a real 3D model rotate on screen, send a branded PDF quote — all from a tablet on the job site.

Built for builders, landscapers, fencers, and pergola installers. Fork it, plug in your prices and logo, deploy in 15 minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fluke-selrai%2Fdeck-quoter-demo&env=ANTHROPIC_API_KEY&envDescription=Required%20for%20the%20Capture%20from%20Site%20feature.%20Get%20yours%20at%20console.anthropic.com&envLink=https%3A%2F%2Fconsole.anthropic.com%2Fsettings%2Fkeys&project-name=deck-quoter&repository-name=deck-quoter)

---

## What it does

- **Real parametric 3D deck** — boards, joists, posts, railing, stairs. Drag to rotate, scroll to zoom.
- **Form inputs** — length, width, height, material, stairs, railing. Updates the 3D model and the price in real time.
- **Capture from site (AI)** — take a photo + record a voice note (in en-AU), Claude Opus 4.6 extracts the deck spec, you review and confirm before it touches the form.
- **Live pricing engine** — materials + labour + project loading + GST. Totals always visible top-right.
- **Branded PDF quote** — captures the 3D render, embeds it in an A4 PDF with your logo, ABN, line items, payment terms.
- **Settings panel** — edit your prices, materials, labour rates, logo, business details. Saved to your browser; export/import as JSON to keep it across devices.

## Install it — non-technical version (15 min)

You need a GitHub account, a Vercel account, and an Anthropic API key.

1. **Fork this repo** — click the "Use this template" or "Fork" button at the top of the GitHub page.
2. **Click the "Deploy with Vercel" button above.** Vercel will:
   - Ask which GitHub repo to use (pick your fork)
   - Ask you to paste your `ANTHROPIC_API_KEY` — get one at <https://console.anthropic.com/settings/keys>
   - Deploy your live site (~2 min)
3. **Open the URL Vercel gives you.** Click the gear icon top-right → enter your business name, phone, ABN, and prices.
4. **Done.** Save the URL to your phone's home screen. Pull it out on every quote.

## Local dev

```sh
npm install
cp .env.example .env.local      # add your ANTHROPIC_API_KEY
npm run dev
```

Open <http://localhost:3000>.

## Swap your prices and branding

Two ways:

- **In the app:** click the gear icon → edit prices, materials, business info, upload logo. Saved to your browser.
- **In code:** edit `app/lib/pricebook.json`, commit, redeploy. Permanent across all devices.

Use "Export pricebook.json" in the settings panel to download your edits and commit them.

## Without the Anthropic key

The "Capture from site" button needs `ANTHROPIC_API_KEY`. Everything else (3D model, form inputs, live pricing, PDF download, settings) works without it — type the measurements in by hand.

## Tech

- Next.js 16 + React 19 (App Router, Turbopack)
- Three.js + react-three-fiber + drei (3D)
- Tailwind v4 (styling)
- @anthropic-ai/sdk + Claude Opus 4.6 (vision + adaptive thinking + prompt cache)
- Web Speech API (voice → text, on-device, no extra key)
- @react-pdf/renderer (PDF generation, client-side)
- Vercel (deploy)

## Roadmap

- **Phase 4 (next):** AI photoreal "beauty shot" via Nano Banana, embedded alongside the parametric render
- **Phase 5:** GHL/Xero integration to push the quote straight to your CRM
- **Phase 6:** Multi-shape decks (L-shape, wraparound) via drawing canvas

## License

MIT. Built by Selr AI as a workshop reference build. Use it, fork it, sell quotes off it.
