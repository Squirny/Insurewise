# Insurewise

Bilingual (EN/ID) static website for Insurewise — B2B SME insurance advisory for Indonesia.
Covers: Employee Benefits, Property, Liability, Cargo & Marine.

## Structure
- `index.html` — homepage
- `quote.html` — multi-step indicative quote tool (front-end only)
- `products/` — SEO landing pages per product line
- `about.html` — about page
- `css/`, `js/`, `assets/` — styles, scripts, logo
- `sitemap.xml`, `robots.txt` — SEO

## Run locally
Open `index.html` in a browser, or serve: `python3 -m http.server`

## Deploy
Works on any static host (GitHub Pages, Netlify, Vercel, cPanel).
For GitHub Pages: Settings → Pages → deploy from `main` / root.

## Notes
- Quote estimates are indicative only. Adjust rates in `js/quote.js`.
- Lead capture integration point is marked in `js/quote.js`.
