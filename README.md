# NUUK & Human — website

Static, bilingual (EN / TR) site for NUUK & Human, specialist recruitment & HR advisory.
Live preview: https://ahmetsozt.github.io/nuukandhuman/

- Content: `content/site.json` (public content only — no business plan or pricing).
- Build: `npm run build` → `dist/` (no dependencies, Node 20+).
- Test: `npm test`
- Local preview: `npm run serve` → http://localhost:4321/nuukandhuman/
- Deploy: push to `main`; GitHub Actions builds and publishes to Pages.

## Forms

Forms pick a mode automatically from `content/site.json`:

| Setting | Mode | Behaviour |
|---|---|---|
| `backend.form_endpoint` set (https) | endpoint | POSTs to your server; success only on a 2xx reply. |
| `identity.contact.email` set | email | Opens the visitor's mail app pre-filled; the candidate attaches the CV there. |
| neither | offline | Rendered but disabled (current state). |

## Still open

- `identity.contact.email` is `null`, so the forms are offline and Contact shows "coming soon". Add an address to switch the forms to email mode.
- Privacy, candidate privacy and terms are **drafts** (marked on the page). They need legal review, and the company legal name and address once registered.
- Custom domain: write a `CNAME` file into `dist/` from `src/build.mjs`, set `seo.site_url`, and build with `BASE_PATH=""`.
