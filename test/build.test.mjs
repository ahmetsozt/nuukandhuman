import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import { build } from "../src/build.mjs";
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

test("each page has lang, one h1, noindex while in draft, and a CSP", async () => {
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const isTr = file.includes(`${outDir}/tr/`);
    assert.match(html, new RegExp(`<html lang="${isTr ? "tr" : "en"}"`), file);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${file} h1 count`);
    assert.match(html, /name="robots" content="noindex/);
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

test("robots.txt blocks crawling while indexing is off", async () => {
  assert.equal(await readFile(join(outDir, "robots.txt"), "utf8"), "User-agent: *\nDisallow: /\n");
});
