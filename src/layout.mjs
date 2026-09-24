import { esc, t, join, icon } from "./lib/html.mjs";

function csp(site) {
  const endpoint = site.backend.form_endpoint ? new URL(site.backend.form_endpoint).origin : "";
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' ${endpoint}`.trim(),
    `form-action 'self' ${endpoint}`.trim(),
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

function head(ctx, { title, description, path, altPath = path }) {
  const { site, lang, urls } = ctx;
  const origin = site.seo.site_url.replace(/\/[^/]*$/, "");
  const abs = (l) => `${origin}${urls.page(l, l === lang ? path : altPath)}`;
  return join([
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta http-equiv="Content-Security-Policy" content="${esc(csp(site))}">`,
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    site.seo.indexing ? "" : '<meta name="robots" content="noindex, nofollow">',
    `<link rel="canonical" href="${esc(abs(lang))}">`,
    ...site.identity.languages.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(abs(l))}">`),
    `<link rel="alternate" hreflang="x-default" href="${esc(abs("en"))}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="${lang === "tr" ? "tr_TR" : "en_US"}">`,
    `<meta name="theme-color" content="${esc(site.design.palette.ink)}">`,
    `<link rel="icon" href="${urls.asset("favicon.svg")}" type="image/svg+xml">`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700&display=swap">',
    `<link rel="stylesheet" href="${urls.asset("styles.css")}">`,
    `<script src="${urls.asset("main.js")}" defer></script>`,
  ]);
}

function header(ctx, { path, altPath = path, activeId }) {
  const { site, lang, urls } = ctx;
  const other = lang === "en" ? "tr" : "en";
  const links = site.navigation
    .map((item) => {
      const current = item.id === activeId ? ' aria-current="page"' : "";
      return `<li><a href="${urls.page(lang, item.path)}"${current}>${esc(t(item.label, lang))}</a></li>`;
    })
    .join("");
  return `<header class="site-header" data-header>
  <div class="wrap header-row">
    <a class="brand" href="${urls.page(lang, "/")}" aria-label="NUUK &amp; Human — ${esc(t(site.ui.back_home, lang))}">
      <img class="brand-ink" src="${urls.asset("logo-ink.png")}" alt="NUUK &amp; Human" width="900" height="104">
      <img class="brand-white" src="${urls.asset("logo-white.png")}" alt="" width="900" height="104">
    </a>
    <nav class="primary-nav" id="primary-nav" aria-label="${lang === "tr" ? "Ana menü" : "Main navigation"}" data-nav>
      <ul>${links}</ul>
      <a class="lang-switch" href="${urls.page(other, altPath)}" hreflang="${other}" lang="${other}" aria-label="${esc(t(site.ui.language_switch_label, lang))}">${esc(t(site.ui.language_switch, lang))}</a>
    </nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-menu-toggle>
      <span class="menu-label" data-open-label="${esc(t(site.ui.menu, lang))}" data-close-label="${esc(t(site.ui.close, lang))}">${esc(t(site.ui.menu, lang))}</span>
      <span class="menu-bars" aria-hidden="true"><span></span><span></span></span>
    </button>
  </div>
</header>`;
}

function footer(ctx) {
  const { site, lang, urls } = ctx;
  const nav = site.navigation.map((i) => `<li><a href="${urls.page(lang, i.path)}">${esc(t(i.label, lang))}</a></li>`).join("");
  const legal = site.legal_pages.map((p) => `<li><a href="${urls.page(lang, p.path)}">${esc(t(p.title, lang))}</a></li>`).join("");
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="${urls.asset("logo-white.png")}" alt="NUUK &amp; Human" width="900" height="104" loading="lazy">
        <p class="footer-tagline">${esc(t(site.identity.tagline, lang))}</p>
        <p class="footer-meta">${esc(t(site.identity.location_label, lang))}<br>${esc(t(site.identity.corridor_label, lang))}</p>
      </div>
      <nav aria-label="${lang === "tr" ? "Alt menü" : "Footer navigation"}"><ul class="footer-list">${nav}</ul></nav>
      <nav aria-label="${esc(t(site.ui.legal, lang))}"><p class="footer-head">${esc(t(site.ui.legal, lang))}</p><ul class="footer-list">${legal}</ul></nav>
    </div>
    <div class="footer-bottom">
      <p>${esc(t(site.identity.brand_separation, lang))}</p>
      <p>© ${new Date().getFullYear()} NUUK &amp; Human</p>
    </div>
  </div>
</footer>`;
}

export function layout(ctx, page) {
  const { site, lang } = ctx;
  const banner = site.seo.indexing
    ? ""
    : `<p class="draft-banner" role="note">${esc(t(site.ui.draft_banner, lang))}</p>`;
  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
${head(ctx, page)}
</head>
<body class="${esc(page.bodyClass ?? "")}">
<a class="skip-link" href="#main">${esc(t(site.ui.skip, lang))}</a>
${banner}
${header(ctx, page)}
<main id="main" tabindex="-1">
${page.body}
</main>
${footer(ctx)}
</body>
</html>
`;
}

export const arrowLink = (href, label, cls = "text-link") =>
  `<a class="${cls}" href="${href}"><span>${esc(label)}</span>${icon.arrow}</a>`;
