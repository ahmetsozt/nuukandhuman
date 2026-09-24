# NUUK & Human — website

Static, bilingual (EN / TR) site for NUUK & Human, specialist recruitment & HR advisory.
Live preview: https://ahmetsozt.github.io/nuukandhuman/

- Content: `content/site.json` (public content only — no business plan or pricing).
- Build: `npm run build` → `dist/` (no dependencies, Node 20+).
- Test: `npm test`
- Local preview: `npm run serve` → http://localhost:4321/nuukandhuman/
- Deploy: push to `main`; GitHub Actions builds and publishes to Pages.

## Before launch

- `backend.form_endpoint` is `null`, so both forms render **disabled** and cannot show a success message.
  Set it to an HTTPS endpoint that validates server-side, rate-limits, checks real file types and stores CVs privately.
- `identity.contact.*`, legal name, licence and address are `null` and are not shown.
- Legal pages (privacy, candidate privacy, terms) still need real text.
- `seo.indexing` is `false`: every page is `noindex` and `robots.txt` blocks crawlers. Flip it after the above.
- Custom domain: write a `CNAME` file into `dist/` from `src/build.mjs`, set `seo.site_url`, and build with `BASE_PATH=""`.
