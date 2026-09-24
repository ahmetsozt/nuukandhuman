// Reusable page sections. Each takes the build context { site, lang, urls }.
import { esc, t, icon } from "./lib/html.mjs";
import { arrowLink } from "./layout.mjs";

const pad2 = (n) => String(n).padStart(2, "0");
const list = (items, cls = "rule-list") => `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;

export function pageHero(ctx, { kicker, title, body, dark = true }) {
  return `<section class="page-hero${dark ? " is-dark" : ""}">
  <div class="wrap page-hero-inner">
    ${kicker ? `<p class="eyebrow">${esc(kicker)}</p>` : ""}
    <h1 class="display-l">${esc(title)}</h1>
    ${body ? `<p class="lede">${esc(body)}</p>` : ""}
  </div>
  <span class="amp-motif" aria-hidden="true">&amp;</span>
</section>`;
}

export function homeHero(ctx) {
  const { site, lang, urls } = ctx;
  const h = site.home.hero;
  return `<section class="hero is-dark" aria-labelledby="hero-title">
  <div class="wrap hero-inner">
    <p class="eyebrow">${esc(t(h.eyebrow, lang))}</p>
    <h1 class="display-xl" id="hero-title">${esc(t(h.headline, lang))}</h1>
    <p class="lede">${esc(t(h.body, lang))}</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="${urls.page(lang, h.primary_cta.href)}">${esc(t(h.primary_cta.label, lang))}${icon.arrow}</a>
      <a class="btn btn-ghost" href="${urls.page(lang, h.secondary_cta.href)}">${esc(t(h.secondary_cta.label, lang))}</a>
    </div>
    <p class="hero-tagline">${esc(t(site.identity.tagline, lang))}</p>
  </div>
  <span class="amp-motif amp-hero" aria-hidden="true">&amp;</span>
</section>`;
}

export function pathCards(ctx) {
  const { site, lang, urls } = ctx;
  const card = (p, cls) => `<a class="path-card ${cls}" href="${urls.page(lang, p.href)}">
    <span class="path-kicker">${esc(t(p.kicker, lang))}</span>
    <span class="path-title">${esc(t(p.title, lang))}</span>
    <span class="path-arrow">${icon.arrow}</span>
  </a>`;
  return `<section class="paths" aria-label="${lang === "tr" ? "Başlangıç noktanızı seçin" : "Choose your starting point"}">
  <div class="wrap paths-grid">
    ${card(site.home.paths.employer, "is-employer")}
    ${card(site.home.paths.candidate, "is-candidate")}
  </div>
</section>`;
}

export function sectorRows(ctx, { detailed = false } = {}) {
  const { site, lang, urls } = ctx;
  const I = site.sectors_intro;
  const rows = site.sectors
    .map((s, i) => {
      const roles = s.roles ?? t(s.role_families, lang);
      const details = detailed
        ? `<div class="sector-details">
        ${s.client_types ? `<div><h4 class="mini-head">${esc(t(I.clients_label, lang))}</h4>${list(t(s.client_types, lang))}</div>` : ""}
        ${s.assessment_focus ? `<div><h4 class="mini-head">${esc(t(I.assessment_label, lang))}</h4>${list(t(s.assessment_focus, lang))}</div>` : ""}
      </div>`
        : "";
      return `<article class="sector-row" id="${esc(s.id)}">
    <span class="row-num" aria-hidden="true">${pad2(i + 1)}</span>
    <div class="sector-main">
      <h3 class="display-s">${esc(t(s.title, lang))}</h3>
      <p>${esc(t(s.description, lang))}</p>
      <h4 class="mini-head">${esc(t(I.roles_label, lang))}</h4>
      <ul class="chips">${roles.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      ${details}
    </div>
  </article>`;
    })
    .join("\n");
  const more = detailed ? "" : `<div class="section-foot">${arrowLink(urls.page(lang, "/sectors/"), t(site.ui.all_sectors, lang))}</div>`;
  return `<section class="section" aria-labelledby="sectors-title">
  <div class="wrap">
    <header class="section-head split">
      <h2 class="display-m" id="sectors-title">${esc(t(I.title, lang))}</h2>
      <p class="section-intro">${esc(t(I.body, lang))}</p>
    </header>
    <div class="sector-list">${rows}</div>
    ${more}
  </div>
</section>`;
}

export function serviceGroups(ctx, { detailed = false } = {}) {
  const { site, lang, urls } = ctx;
  const S = site.services_intro;
  const byId = Object.fromEntries(site.services.map((s) => [s.id, s]));
  const groups = S.groups
    .map((g) => {
      const items = g.items
        .map((id) => {
          const s = byId[id];
          const body = detailed
            ? `<details class="service-more"><summary>${esc(t(S.deliverables_label, lang))}${icon.plus}</summary>${list(t(s.deliverables, lang), "check-list")}</details>`
            : "";
          return `<li class="service-item" id="${esc(s.id)}">
        <h4 class="service-name">${esc(t(s.name, lang))}</h4>
        <p>${esc(t(s.summary, lang))}</p>${body}
      </li>`;
        })
        .join("");
      return `<div class="service-group"><h3 class="group-label">${esc(t(g.label, lang))}</h3><ul class="service-list">${items}</ul></div>`;
    })
    .join("");
  const more = detailed ? "" : `<div class="section-foot">${arrowLink(urls.page(lang, "/services/"), t(site.ui.all_services, lang))}</div>`;
  return `<section class="section is-paper" aria-labelledby="services-title">
  <div class="wrap">
    <header class="section-head">
      <h2 class="display-m" id="services-title">${esc(t(S.title, lang))}</h2>
      <p class="section-intro">${esc(t(S.body, lang))}</p>
    </header>
    <div class="service-groups">${groups}</div>
    ${more}
  </div>
</section>`;
}

export function approach(ctx) {
  const { site, lang } = ctx;
  const items = site.home.differentiators
    .map((d, i) => `<li><span class="big-num" aria-hidden="true">${pad2(i + 1)}</span><h3 class="display-s">${esc(t(d.title, lang))}</h3><p>${esc(t(d.body, lang))}</p></li>`)
    .join("");
  return `<section class="section" aria-labelledby="approach-title">
  <div class="wrap">
    <h2 class="display-m" id="approach-title">${esc(t(site.home.differentiators_title, lang))}</h2>
    <ol class="approach-list">${items}</ol>
  </div>
</section>`;
}

export function processSteps(ctx) {
  const { site, lang } = ctx;
  const steps = site.process
    .map((p) => `<li class="step"><span class="step-num">${pad2(p.step)}</span><h3 class="step-title">${esc(t(p.title, lang))}</h3><p>${esc(t(p.body, lang))}</p></li>`)
    .join("");
  return `<section class="section is-dark process" aria-labelledby="process-title">
  <div class="wrap">
    <h2 class="display-m" id="process-title">${esc(t(site.process_title, lang))}</h2>
    <ol class="steps">${steps}</ol>
  </div>
</section>`;
}

export function founders(ctx, { detailed = false } = {}) {
  const { site, lang, urls } = ctx;
  const A = site.about;
  const cards = A.founders
    .map((f) => `<article class="founder">
    <div class="monogram" aria-hidden="true">${esc(f.initials)}</div>
    <div>
      <h3 class="display-s">${esc(f.name)}</h3>
      <p class="founder-role">${esc(t(f.title, lang))} · ${esc(t(f.remit, lang))}</p>
      <p>${esc(t(f.bio, lang))}</p>
      ${detailed ? list(t(f.responsibilities, lang), "rule-list") : ""}
    </div>
  </article>`)
    .join("");
  const more = detailed ? "" : `<div class="section-foot">${arrowLink(urls.page(lang, "/about/"), t(site.ui.meet_founders, lang))}</div>`;
  return `<section class="section" aria-labelledby="founders-title">
  <div class="wrap">
    <h2 class="display-m" id="founders-title">${esc(t(A.founders_title, lang))}</h2>
    <div class="founder-grid">${cards}</div>
    ${more}
  </div>
</section>`;
}

export function faq(ctx) {
  const { site, lang } = ctx;
  const items = site.faq
    .map((f) => `<details class="faq-item"><summary><span>${esc(t(f.q, lang))}</span>${icon.plus}</summary><p>${esc(t(f.a, lang))}</p></details>`)
    .join("");
  return `<section class="section is-paper" aria-labelledby="faq-title">
  <div class="wrap faq-wrap">
    <h2 class="display-m" id="faq-title">${esc(t(site.faq_title, lang))}</h2>
    <div class="faq-list">${items}</div>
  </div>
</section>`;
}

export function fraudNotice(ctx) {
  const { site, lang } = ctx;
  const F = site.fraud_notice;
  return `<aside class="notice" aria-labelledby="fraud-title">
  <span class="notice-icon">${icon.shield}</span>
  <div><h2 class="notice-title" id="fraud-title">${esc(t(F.title, lang))}</h2><p>${esc(t(F.body, lang))}</p></div>
</aside>`;
}

export function closingCta(ctx) {
  const { site, lang, urls } = ctx;
  const h = site.home.hero;
  return `<section class="closing is-dark" aria-labelledby="closing-title">
  <div class="wrap closing-inner">
    <h2 class="display-l" id="closing-title">${esc(t(site.employers.headline, lang))}</h2>
    <div class="cta-row">
      <a class="btn btn-primary" href="${urls.page(lang, h.primary_cta.href)}">${esc(t(h.primary_cta.label, lang))}${icon.arrow}</a>
      <a class="btn btn-ghost" href="${urls.page(lang, h.secondary_cta.href)}">${esc(t(h.secondary_cta.label, lang))}</a>
    </div>
  </div>
  <span class="amp-motif" aria-hidden="true">&amp;</span>
</section>`;
}
