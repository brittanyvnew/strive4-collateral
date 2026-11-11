# Trust Certificate Studio

A browser app that lets salespeople create high-trust sales certificates (warranties, guarantees, certificates of authenticity, compliance, VIP, partner and gift vouchers), brand them with their own logo and colors, preview them live, and download a print-ready PDF or a PNG.

Built with plain HTML, CSS and JavaScript on Vite. No backend and no API keys: everything runs in the browser.

## Run locally

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

## Import into Google AI Studio

1. Create a new GitHub repository and upload the contents of this folder (keep the folder structure).
2. In Google AI Studio, open **Build**, click **+** in the prompt box and choose **Import from GitHub**, then select the repository.
3. Paste the project brief below into the chat so Gemini understands the app before you ask for changes.

## Project brief for the AI agent

> This is Trust Certificate Studio, a vanilla JavaScript + Vite app (no framework). Keep it framework-free unless asked.
>
> **Files**
> - `index.html`: all editor markup (panel sections 01 to 05, preview stage, modals, mobile bottom bar).
> - `src/styles.css`: two parts. The top half is the app UI, styled with the Strive4 design system tokens (`--primary` forest `#50743e`, `--accent` gold `#c4920f`, Figtree font, 4px/8px radii, borders over shadows). The bottom half (`.cert`, `.c-*`, `.v-*`) styles the certificate itself.
> - `src/app.js`: the whole app in one IIFE. Main parts, in order: helpers and color math; `TPL`, the array of 10 certificate templates (each has `fields`, `auto` wording functions, `facts`, optional `list`/`hero`, and `seal` text); `FONTS`, `PRESETS`, `SIZES`; state and localStorage persistence; canvas generators for the seal, guilloche pattern and QR code; `certHTML()`, which renders the certificate as an HTML string; preview scaling and `autoFit()`, which shrinks type so content always fits; form building; events; logo/signature upload and signature pad; export (html2canvas, then jsPDF for PDF); saved templates library (localStorage plus JSON backup/restore).
> - `src/libs.js`: puts html2canvas, jsPDF and qrcode-generator on `window`.
>
> **Rules to keep**
> - Certificate images (seal, pattern, QR) are generated as PNG data URLs on canvas so html2canvas captures them reliably. Do not swap them for inline SVG.
> - Certificate sizes are fixed pixel sizes at 96 dpi (`SIZES`). The preview scales with a CSS transform; export renders an unscaled offscreen copy.
> - Wording is auto-generated from fields; user edits are stored as overrides in `state.words[templateId]`.
> - When the customer name is blank, its block stays in the layout but is invisible (`.c-rec.is-blank`).
> - Saved state key: `trust-cert-studio:v1`. Saved templates key: `trust-cert-studio:templates:v1`.
> - The `window.claude` downloads code path only runs inside Claude; elsewhere the app falls back to a normal browser download. It can be removed safely.

## Notes

- Logos, signatures and saved templates are stored in the user's browser (localStorage) on that device only.
- Fonts load from Google Fonts (Figtree, Cinzel, Playfair Display, Cormorant Garamond, Great Vibes).
- The QR code links to whatever verification URL the user enters. Real verification needs a backend that records issued certificate numbers.
