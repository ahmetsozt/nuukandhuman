// Local preview server: serves dist/ under /nuukandhuman like GitHub Pages does.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const ROOT = new URL("../dist/", import.meta.url).pathname;
const BASE = "/nuukandhuman";
const PORT = Number(process.env.PORT ?? 4321);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain" };

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!url.startsWith(BASE)) { res.writeHead(302, { Location: `${BASE}/` }).end(); return; }
  let file = normalize(join(ROOT, url.slice(BASE.length)));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type": TYPES[".html"] }).end(await readFile(join(ROOT, "404.html")));
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}/`));
