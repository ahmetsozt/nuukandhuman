// Static site generator for NUUK & Human. No dependencies: `node src/build.mjs`.
// Env: BASE_PATH (default "/nuukandhuman"), OUT_DIR (default "dist").
import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createUrls } from "./lib/html.mjs";
import { layout } from "./layout.mjs";
import { allPages, notFound } from "./pages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVATE_KEYS = ["internal_business_plan", "publication_checks"];

export async function loadSite(file = join(ROOT, "content/site.json")) {
  return validateSite(JSON.parse(await readFile(file, "utf8")));
}

export function validateSite(site) {
  const leaked = PRIVATE_KEYS.filter((k) => k in site);
  if (leaked.length) throw new Error(`Private sections must not be in public content: ${leaked.join(", ")}`);
  for (const key of ["identity", "navigation", "home", "sectors", "services", "forms", "seo", "backend"]) {
    if (!site[key]) throw new Error(`site.json is missing "${key}"`);
  }
  if (site.backend.form_endpoint && !/^https:\/\//.test(site.backend.form_endpoint)) {
    throw new Error("backend.form_endpoint must be an https URL");
  }
  const email = site.identity.contact.email;
  if (email && !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(email)) {
    throw new Error("identity.contact.email is not a valid address");
  }
  return site;
}

const outFile = (outDir, lang, path) => {
  const rel = `${lang === "tr" ? "/tr" : ""}${path}`;
  return join(outDir, rel.endsWith("/") ? `${rel}index.html` : rel);
};

async function write(file, content) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

function favicon(site) {
  const { ink, paper } = site.design.palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${ink}"/><text x="32" y="47" font-family="Georgia,serif" font-size="44" text-anchor="middle" fill="${paper}">&amp;</text></svg>`;
}

function sitemap(origin, paths) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = paths.map((p) => `  <url><loc>${origin}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export async function build({ site: siteOverride, basePath = process.env.BASE_PATH ?? "/nuukandhuman", outDir = process.env.OUT_DIR ?? join(ROOT, "dist") } = {}) {
  const site = siteOverride ? validateSite(siteOverride) : await loadSite();
  const urls = createUrls(basePath);
  await rm(outDir, { recursive: true, force: true });

  const written = [];
  const sitemapPaths = [];
  for (const lang of site.identity.languages) {
    const ctx = { site, lang, urls };
    for (const page of allPages(ctx)) {
      const file = outFile(outDir, lang, page.path);
      await write(file, layout(ctx, page));
      written.push(file);
      sitemapPaths.push(urls.page(lang, page.path));
    }
  }
  const ctxEn = { site, lang: "en", urls };
  await write(join(outDir, "404.html"), layout(ctxEn, notFound(ctxEn)));

  await cp(join(ROOT, "assets"), join(outDir, "assets"), { recursive: true });
  await cp(join(ROOT, "src/client"), join(outDir, "assets"), { recursive: true });
  await write(join(outDir, "assets/favicon.svg"), favicon(site));
  await write(join(outDir, ".nojekyll"), "");
  const origin = new URL(site.seo.site_url).origin;
  await write(join(outDir, "robots.txt"), site.seo.indexing
    ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}${urls.base}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n");
  if (site.seo.indexing) await write(join(outDir, "sitemap.xml"), sitemap(origin, sitemapPaths));
  return { site, outDir, pages: written.length + 1 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build()
    .then(({ outDir, pages }) => console.log(`Built ${pages} pages into ${outDir}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
