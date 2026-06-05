# Insurewise — Project Handoff Brief

Paste this into a new Project's instructions/knowledge (and link the GitHub repo) so a fresh
chat can continue the build without re-reading the whole previous conversation.

## What this is
Insurewise — a bilingual (EN/ID) static marketing + lead-gen website for a B2B SME
insurance brokerage in Indonesia. Hand-coded HTML/CSS/JS. No build step.

## Where everything lives (source of truth)
- **GitHub:** https://github.com/Squirny/Insurewise (branch `main`)
- **Live site:** https://www.insurewise.club (hosted on Cloudflare — Worker/Pages, auto-deploys on push to `main`)
- **DNS:** Cloudflare. **Domain registrar:** Squarespace. **Email:** Google Workspace (sk@insurewise.club) — do NOT touch MX/SPF/DKIM records.
- To continue: clone the repo, edit, commit, push to `main`. Cloudflare redeploys automatically.

## Tech conventions (match these exactly)
- Every visible string is bilingual via `data-en="..."` and `data-id="..."` attributes; `js/main.js` swaps them and remembers choice in localStorage. Header has EN/ID toggle.
- Shared styles in `css/styles.css`; shared nav/footer copied into each page (no includes).
- Logo: `assets/logo.png` (header) and `assets/logo-white.png` (dark footers). Favicon = logo.png.
- Contact email everywhere: **sk@insurewise.club**. WhatsApp: **6282114294549** (set in js/main.js as window.IW_WA_NUMBER; powers floating button + quote page).
- Articles live in `/insights/`, built from a repeatable template (header/style/footer + bilingual helper functions). Each has Article schema, FAQ, bilingual, and a "Related reading" block for clusters.
- Money inputs use live thousands separators (commas) + an "IDR" prefix box.

## Site structure
- Pages: index, about, quote, insights (hub). Products: employee-benefits, property, liability, cargo, cyber, compare-health.
- 5 product lines in nav/footer: Employee Benefits, Property, Liability, Cargo, **Cyber**.
- `sitemap.xml` + `robots.txt` present — update sitemap when adding pages.

## Quote tool (js/quote.js + quote.html) — REAL rates embedded
- **Property** = Property All Risks build-up benchmarked from a real **Tokio Marine** PAR+EQ policy:
  FLEXAS 0.0886%, EQVET (earthquake) 0.143%, TSFWD 0.05%, RSMDCC 0.00026%, Other(PAR) 0.00001%, + Rp25,000 policy cost. (Rp15bn SI => Rp42,305,500.) Sum-insured is an open input; "location" replaces headcount for property.
- **Employee Benefits** = real **Lippo HealthPlus Business Essential** table: per-person premium by age band (0-18,19-30,31-40,41-55,56-60) × plan tier (inpatient RI2500→RI350, optional outpatient RJ150→RJ25). Itemised breakdown.
- Liability & Cargo still use placeholder indicative rates (no real rate card yet).
- Inline article calculators on the padel and Bali villa articles reuse the property PAR rates.

## Lead capture
- Quote form posts to a **Google Sheet** via Apps Script webhook (URL set in js/quote.js `SHEET_WEBHOOK_URL`). Working.
- WhatsApp = wa.me click-to-chat (no backend). The old Cloudflare Function approach was removed.

## Insurer partners
- General/health partners (shown on site): Zurich, AXA, Allianz, AIA, Tokio Marine, Hanwha, Sunday, ACA, Lippo, Mandiri.
- **Cyber partners specifically: AIG, Sinarmas General, Chubb** (shown on cyber page + article).
- Comparison page (compare-health.html) has an editable INSURERS array; some figures sourced from public listings and marked indicative — verify before relying.

## Content published (Insights) — 6 articles
1. What is employee benefit & why companies should take it
2. HR survival guide 2026 (KAPJ / BPJS compliance / KRIS)
3. Property insurance + Iran-war reinsurance effect
4. Liability insurance explainer
5. Cargo insurance + Strait of Hormuz effect
6. Padel court insurance (incl. Kemang data point: 4 of 13 clubs insured) + calculator
7. Bali villa insurance 2026 (nominee/licensing) + calculator
8. Cyber insurance Indonesia (UU PDP focus)
(Property cluster cross-linked via "Related reading".)

## Editorial / accuracy rules we follow
- Verify regulatory/stat claims with web search before publishing; soften unverifiable specifics to "industry estimates"; add a "general info, not legal/tax advice" disclaimer on regulatory pieces.
- Write original content (don't copy competitor text); use sources as reference only.

## Open / backlog (next steps)
- **SEO setup (user to do):** verify Google Search Console (placeholder meta tag in index.html `REPLACE_WITH_YOUR_SEARCH_CONSOLE_TOKEN`), submit sitemap; create Google Business Profile (copy in Google-Business-Profile-Insurewise.md); pursue backlinks.
- **Content plan:** see Insurewise-Content-Plan.md — 18 keyword-mapped topics; next quick wins = BPJS vs private, EB cost, PAR explained, cargo explained, why-a-broker.
- **"Our clients" section** on About is built but commented-out/removed — needs official client logo files + permission to revive.
- **Cyber calculator:** skipped (no Indonesian cyber rate card); build a limit-based estimator once a partner rate guide is available. Cyber not yet a selectable cover in the quote tool.
- Replace text insurer names with official logo files when available (need brand-usage rights).
- Refresh the time-sensitive "market note" sections (Iran war / Hormuz) periodically.

## Useful files in the outputs folder
- Google-Business-Profile-Insurewise.md (GBP copy)
- Insurewise-Content-Plan.md (SEO backlog)
- insurewise-site.zip (full site snapshot)
