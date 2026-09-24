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
  const site = JSON.parse(await readFile(file, "utf8"));
  const leaked = PRIVATE_KEYS.filter((k) => k in site);
  if (leaked.length) throw new Error(`Private sections must not be in public content: ${leaked.join(", ")}`);
  for (const key of ["identity", "navigation", "home", "sectors", "services", "forms", "seo", "backend"]) {
    if (!site[key]) throw new Error(`site.json is missing "${key}"`);
  }
  if (site.backend.form_endpoint && !/^https:\/\//.test(site.backend.form_endpoint)) {
    throw new Error("backend.form_endpoint must be an https URL");
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

export async function build({ basePath = process.env.BASE_PATH ?? "/nuukandhuman", outDir = process.env.OUT_DIR ?? join(ROOT, "dist") } = {}) {
  const site = await loadSite();
  const urls = createUrls(basePath);
  await rm(outDir, { recursive: true, force: true });

  const written = [];
  for (const lang of site.identity.languages) {
    const ctx = { site, lang, urls };
    for (const page of allPages(ctx)) {
      const file = outFile(outDir, lang, page.path);
      await write(file, layout(ctx, page));
      written.push(file);
    }
  }
  const ctxEn = { site, lang: "en", urls };
  await write(join(outDir, "404.html"), layout(ctxEn, notFound(ctxEn)));

  await cp(join(ROOT, "assets"), join(outDir, "assets"), { recursive: true });
  await cp(join(ROOT, "src/client"), join(outDir, "assets"), { recursive: true });
  await write(join(outDir, "assets/favicon.svg"), favicon(site));
  await write(join(outDir, ".nojekyll"), "");
  await write(join(outDir, "robots.txt"), site.seo.indexing ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n");
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
