import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import { build, loadSite } from "../src/build.mjs";
import { esc, t, createUrls } from "../src/lib/html.mjs";

const BASE = "/nuukandhuman";
let outDir;
let htmlFiles;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}

before(async () => {
  outDir = await mkdtemp(join(tmpdir(), "nuh-"));
  await build({ basePath: BASE, outDir });
  htmlFiles = (await walk(outDir)).filter((f) => f.endsWith(".html"));
});

test("esc neutralises HTML special characters", () => {
  assert.equal(esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  assert.equal(esc(null), "");
});

test("t picks the language and throws on a missing translation", () => {
  assert.equal(t({ en: "Hi", tr: "Merhaba" }, "tr"), "Merhaba");
  assert.equal(t("plain", "tr"), "plain");
  assert.throws(() => t({ en: null, tr: null }, "tr"));
});

test("createUrls prefixes the base path and the Turkish locale", () => {
  const u = createUrls("/nuukandhuman/");
  assert.equal(u.page("en", "/about/"), "/nuukandhuman/about/");
  assert.equal(u.page("tr", "/about/"), "/nuukandhuman/tr/about/");
});

test("builds every page in both languages plus 404", async () => {
  const expected = ["", "about/", "sectors/", "services/", "employers/", "candidates/", "contact/", "privacy/", "candidate-privacy/", "terms/", "cookies/"];
  for (const prefix of ["", "tr/"]) {
    for (const p of expected) await stat(join(outDir, prefix, p, "index.html"));
  }
  await stat(join(outDir, "404.html"));
  assert.equal(htmlFiles.length, expected.length * 2 + 1);
});

test("no private planning data or placeholder values reach the output", async () => {
  const banned = [/internal_business_plan/, /publication_checks/, /\bAED\b/, /operating_result/, /MOHRE/i, /\bnull\b/, /\bundefined\b/, /\[object Object\]/];
  for (const file of await walk(outDir)) {
    if (!/\.(html|txt)$/.test(file)) continue;
    const body = await readFile(file, "utf8");
    for (const re of banned) assert.doesNotMatch(body, re, `${file} contains ${re}`);
  }
});

test("each page has lang, one h1, is indexable, and has a CSP", async () => {
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const isTr = file.includes(`${outDir}/tr/`);
    assert.match(html, new RegExp(`<html lang="${isTr ? "tr" : "en"}"`), file);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${file} h1 count`);
    assert.doesNotMatch(html, /name="robots" content="noindex/);
    assert.doesNotMatch(html, /class="draft-banner"/);
    assert.match(html, /Content-Security-Policy/);
  }
});

test("all internal links and assets resolve to built files", async () => {
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const [, href] of html.matchAll(/(?:href|src)="(\/nuukandhuman[^"#?]*)/g)) {
      const rel = href.slice(BASE.length) || "/";
      const target = rel.endsWith("/") ? join(outDir, rel, "index.html") : join(outDir, rel);
      await assert.doesNotReject(stat(target), `${file} → ${href}`);
    }
  }
});

test("forms cannot submit and show no success state without a backend", async () => {
  for (const page of ["employers", "candidates"]) {
    const html = await readFile(join(outDir, page, "index.html"), "utf8");
    assert.match(html, /data-mode="offline"/);
    assert.match(html, /<fieldset disabled>/);
    assert.match(html, /aria-disabled="true"/);
    assert.doesNotMatch(html, /data-live/);
    assert.match(html, /class="form-offline"/);
  }
});

test("every form control has a matching label", async () => {
  for (const page of ["employers", "candidates", "tr/candidates"]) {
    const html = await readFile(join(outDir, page, "index.html"), "utf8");
    const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(ids.length > 5);
    for (const id of ids) assert.match(html, new RegExp(`<label for="${id}"`), `${page}: ${id}`);
  }
});

test("candidate pages state the no-fee policy and the scam notice", async () => {
  const en = await readFile(join(outDir, "candidates", "index.html"), "utf8");
  const tr = await readFile(join(outDir, "tr", "candidates", "index.html"), "utf8");
  assert.match(en, /never charged recruitment or placement fees/);
  assert.match(en, /recruitment scams/);
  assert.match(tr, /ücreti alınmaz/);
});

test("robots.txt allows crawling and points at a sitemap listing every page", async () => {
  const robots = await readFile(join(outDir, "robots.txt"), "utf8");
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/ahmetsozt\.github\.io\/nuukandhuman\/sitemap\.xml/);
  const map = await readFile(join(outDir, "sitemap.xml"), "utf8");
  assert.equal((map.match(/<loc>/g) ?? []).length, htmlFiles.length - 1);
});

test("legal pages carry real sections and a draft note", async () => {
  for (const page of ["privacy", "candidate-privacy", "terms", "tr/privacy"]) {
    const html = await readFile(join(outDir, page, "index.html"), "utf8");
    assert.ok((html.match(/<h2>/g) ?? []).length >= 5, page);
    assert.match(html, /class="legal-note"/);
  }
});

test("home page has Open Graph image and Organization JSON-LD without contact data", async () => {
  const html = await readFile(join(outDir, "index.html"), "utf8");
  assert.match(html, /og:image" content="https:\/\/ahmetsozt\.github\.io\/nuukandhuman\/assets\/og-image\.png"/);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(ld["@type"], "Organization");
  assert.equal(ld.email, undefined);
  await stat(join(outDir, "assets", "og-image.png"));
});

test("with a contact email, forms switch to email mode and drop the file upload", async () => {
  const site = await loadSite();
  const withEmail = { ...site, identity: { ...site.identity, contact: { ...site.identity.contact, email: "hello@example.com" } } };
  const dir = await mkdtemp(join(tmpdir(), "nuh-email-"));
  await build({ site: withEmail, basePath: BASE, outDir: dir });
  const html = await readFile(join(dir, "candidates", "index.html"), "utf8");
  assert.match(html, /data-mode="email"/);
  assert.match(html, /data-mailto="hello@example.com"/);
  assert.doesNotMatch(html, /type="file"/);
  assert.doesNotMatch(html, /<fieldset disabled>/);
  assert.match(html, /form-action &#39;self&#39; mailto:/);
  assert.match(await readFile(join(dir, "contact", "index.html"), "utf8"), /mailto:hello@example.com/);
});

test("an invalid contact email fails the build", async () => {
  const site = await loadSite();
  const bad = { ...site, identity: { ...site.identity, contact: { ...site.identity.contact, email: "not-an-email" } } };
  await assert.rejects(build({ site: bad, basePath: BASE, outDir: await mkdtemp(join(tmpdir(), "nuh-bad-")) }), /not a valid address/);
});
