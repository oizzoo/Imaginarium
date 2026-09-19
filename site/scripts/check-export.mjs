import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../out/", import.meta.url));
for (const file of ["index.html", "404.html", "404/index.html"]) {
  assert.ok(fs.statSync(path.join(output, file)).isFile(), "Missing " + file);
}
const files = fs.readdirSync(output, { recursive: true });
const pages = files.filter((file) => file.endsWith(".html"));
let references = 0;
for (const file of pages) {
  const html = fs.readFileSync(path.join(output, file), "utf8");
  assert.match(html, /<html[^>]*lang="pl"/, file + ": missing language");
  assert.match(html, /<main[\s>]/, file + ": missing main");
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/, file + ": preview must stay noindex");
  const base = new URL(file, "https://export.invalid/");
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"), base);
    if (url.origin !== base.origin) continue;
    let target = path.join(output, decodeURIComponent(url.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, "index.html");
    }
    assert.ok(fs.existsSync(target), file + ": missing " + url.pathname);
    references++;
  }
}
assert.ok(files.some((file) => file.endsWith(".js")), "Missing client assets");
assert.ok(files.some((file) => file.endsWith(".css")), "Missing stylesheet");
console.log("EXPORT_OK pages=" + pages.length + " local_references=" + references);
