import { esc, t, join } from "./lib/html.mjs";
import { renderForm } from "./forms.mjs";
import {
  pageHero, homeHero, pathCards, sectorRows, serviceGroups, approach,
  processSteps, founders, faq, fraudNotice, closingCta,
} from "./sections.mjs";

const navLabel = (site, id, lang) => t(site.navigation.find((n) => n.id === id).label, lang);
const titled = (site, label, lang) => `${label} | ${site.identity.name}`;

function home(ctx) {
  const { site, lang } = ctx;
  return {
    path: "/",
    activeId: null,
    bodyClass: "page-home",
    title: t(site.seo.home_title, lang),
    description: t(site.seo.home_description, lang),
    body: join([homeHero(ctx), pathCards(ctx), sectorRows(ctx), serviceGroups(ctx), approach(ctx), founders(ctx), processSteps(ctx), faq(ctx), closingCta(ctx)]),
  };
}

function about(ctx) {
  const { site, lang } = ctx;
  const A = site.about;
  const values = A.values.map((v, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${esc(t(v, lang))}</li>`).join("");
  return {
    path: "/about/",
    activeId: "about",
    title: titled(site, navLabel(site, "about", lang), lang),
    description: t(A.body, lang).slice(0, 155),
    body: join([
      pageHero(ctx, { kicker: navLabel(site, "about", lang), title: t(A.title, lang) }),
      `<section class="section"><div class="wrap about-grid">
        <p class="lede-dark">${esc(t(A.body, lang))}</p>
        <div class="mission"><p class="eyebrow">${esc(t(A.mission_label, lang))}</p><p class="display-s">${esc(t(A.mission, lang))}</p></div>
      </div></section>`,
      `<section class="section is-paper" aria-labelledby="values-title"><div class="wrap">
        <h2 class="display-m" id="values-title">${esc(t(A.values_label, lang))}</h2>
        <ol class="values">${values}</ol>
      </div></section>`,
      founders(ctx, { detailed: true }),
      closingCta(ctx),
    ]),
  };
}

function sectors(ctx) {
  const { site, lang } = ctx;
  return {
    path: "/sectors/",
    activeId: "sectors",
    title: titled(site, navLabel(site, "sectors", lang), lang),
    description: t(site.sectors_intro.body, lang),
    body: join([
      pageHero(ctx, { kicker: navLabel(site, "sectors", lang), title: t(site.identity.positioning, lang) }),
      sectorRows(ctx, { detailed: true }),
      closingCta(ctx),
    ]),
  };
}

function services(ctx) {
  const { site, lang } = ctx;
  return {
    path: "/services/",
    activeId: "services",
    title: titled(site, navLabel(site, "services", lang), lang),
    description: t(site.services_intro.body, lang),
    body: join([
      pageHero(ctx, { kicker: navLabel(site, "services", lang), title: t(site.services_intro.title, lang), body: t(site.services_intro.body, lang) }),
      serviceGroups(ctx, { detailed: true }),
      processSteps(ctx),
      closingCta(ctx),
    ]),
  };
}

function employers(ctx) {
  const { site, lang } = ctx;
  const E = site.employers;
  const expect = t(E.expect, lang).map((e, i) => `<li><span>${i + 1}</span>${esc(e)}</li>`).join("");
  return {
    path: "/employers/",
    activeId: "employers",
    title: titled(site, navLabel(site, "employers", lang), lang),
    description: t(E.body, lang),
    body: join([
      pageHero(ctx, { kicker: t(E.kicker, lang), title: t(E.headline, lang), body: t(E.body, lang) }),
      `<section class="section" id="inquiry" aria-labelledby="inquiry-title"><div class="wrap form-layout">
        <div class="form-aside">
          <h2 class="display-s" id="inquiry-title">${esc(t(E.expect_title, lang))}</h2>
          <ol class="expect-list">${expect}</ol>
        </div>
        <div class="form-card">${renderForm(ctx, E.form_id)}</div>
      </div></section>`,
      processSteps(ctx),
      faq(ctx),
    ]),
  };
}

function candidates(ctx) {
  const { site, lang } = ctx;
  const C = site.candidates;
  const vacancies = C.vacancies.enabled && C.vacancies.items.length
    ? "" // Vacancies only appear with a real client mandate and publishing permission.
    : `<p class="empty-state">${esc(t(C.vacancies.empty_state, lang))}</p>`;
  return {
    path: "/candidates/",
    activeId: "candidates",
    title: titled(site, navLabel(site, "candidates", lang), lang),
    description: t(C.body, lang),
    body: join([
      pageHero(ctx, { kicker: t(C.kicker, lang), title: t(C.headline, lang), body: t(C.body, lang) }),
      `<section class="section"><div class="wrap">
        <div class="promise"><p class="display-s">${esc(t(C.fee_statement, lang))}</p><p>${esc(t(C.expectations, lang))}</p></div>
        ${fraudNotice(ctx)}
        <h2 class="display-s vacancies-title">${esc(t(C.vacancies_title, lang))}</h2>
        ${vacancies}
      </div></section>`,
      `<section class="section is-paper" id="submit" aria-labelledby="submit-title"><div class="wrap form-layout">
        <div class="form-aside"><h2 class="display-s" id="submit-title">${esc(t(site.home.hero.secondary_cta.label, lang))}</h2>
        <p>${esc(t(C.fee_statement, lang))}</p></div>
        <div class="form-card">${renderForm(ctx, C.form_id)}</div>
      </div></section>`,
    ]),
  };
}

function contact(ctx) {
  const { site, lang, urls } = ctx;
  const K = site.contact;
  const c = site.identity.contact;
  const details = c.email
    ? `<p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`
    : `<p class="empty-state">${esc(t(K.details_pending, lang))}</p>`;
  const route = (p, cls) => `<a class="path-card ${cls}" href="${urls.page(lang, p.href)}"><span class="path-kicker">${esc(t(p.kicker, lang))}</span><span class="path-title">${esc(t(p.title, lang))}</span></a>`;
  return {
    path: "/contact/",
    activeId: "contact",
    title: titled(site, navLabel(site, "contact", lang), lang),
    description: t(K.body, lang),
    body: join([
      pageHero(ctx, { kicker: navLabel(site, "contact", lang), title: t(K.headline, lang), body: t(K.body, lang) }),
      `<section class="section"><div class="wrap">
        <div class="paths-grid is-static">${route(site.home.paths.employer, "is-employer")}${route(site.home.paths.candidate, "is-candidate")}</div>
        <div class="contact-details"><p class="eyebrow">${esc(t(site.identity.location_label, lang))}</p>${details}</div>
      </div></section>`,
    ]),
  };
}

function legalBody(ctx, page) {
  const { site, lang } = ctx;
  if (!page.content) return `<p>${esc(t(site.ui.legal_pending, lang))}</p>`;
  const content = t(page.content, lang);
  if (typeof content === "string") return `<p>${esc(content)}</p>`;
  return content
    .map((sec) => `<h2>${esc(sec.h)}</h2>${sec.p.map((para) => `<p>${esc(para)}</p>`).join("")}`)
    .join("\n");
}

function legal(ctx, page) {
  const { site, lang } = ctx;
  const note = page.draft ? `<p class="legal-note">${esc(t(site.ui.legal_draft_note, lang))}</p>` : "";
  return {
    path: page.path,
    activeId: null,
    title: titled(site, t(page.title, lang), lang),
    description: t(page.title, lang),
    body: join([
      pageHero(ctx, { kicker: t(site.ui.legal, lang), title: t(page.title, lang) }),
      `<section class="section"><div class="wrap prose">${note}${legalBody(ctx, page)}</div></section>`,
    ]),
  };
}

export function notFound(ctx) {
  const { site, lang, urls } = ctx;
  return {
    path: "/404.html",
    altPath: "/",
    activeId: null,
    title: titled(site, t(site.ui.not_found_title, lang), lang),
    description: t(site.ui.not_found_body, lang),
    body: join([
      pageHero(ctx, { kicker: "404", title: t(site.ui.not_found_title, lang), body: t(site.ui.not_found_body, lang) }),
      `<section class="section"><div class="wrap"><a class="btn btn-primary" href="${urls.page(lang, "/")}">${esc(t(site.ui.back_home, lang))}</a></div></section>`,
    ]),
  };
}

export function allPages(ctx) {
  return [home, about, sectors, services, employers, candidates, contact]
    .map((fn) => fn(ctx))
    .concat(ctx.site.legal_pages.map((p) => legal(ctx, p)));
}
