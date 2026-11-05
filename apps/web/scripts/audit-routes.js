// Route audit: match every static href in the app (nav config + in-page links) to a real page.tsx
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const APP = path.join(SRC, 'app');

// 1) Collect all page routes (public URLs).
const routes = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/^page\.(tsx|jsx|js)$/.test(entry.name)) {
      let rel = path.relative(APP, path.dirname(full)).split(path.sep);
      rel = rel.filter((s) => !/^\(.*\)$/.test(s)); // drop route groups
      routes.push(rel);
    }
  }
}
walk(APP);

function routeMatches(segments, hrefSegs) {
  if (segments.length !== hrefSegs.length) return false;
  return segments.every((s, i) => /^\[.*\]$/.test(s) || s === hrefSegs[i]);
}
function resolves(href) {
  const clean = href.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return true; // relative/external skip
  const hrefSegs = clean.replace(/^\//, '').split('/').filter(Boolean);
  if (hrefSegs.some((s) => s.includes('$') || s.includes('{'))) return true; // dynamic skip
  return routes.some((r) => routeMatches(r, hrefSegs));
}

// 2) Scan all .ts/.tsx for fully-static href="/..." literals.
const hits = new Map(); // href -> Set(files)
function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /href[=:]\s*["']([^"'`$]+)["']/g; // static href="..." and href: '...'
  let m;
  while ((m = re.exec(text))) {
    const h = m[1];
    if (!h.startsWith('/')) continue;
    if (h === '/' ) continue;
    if (!resolves(h)) {
      if (!hits.has(h)) hits.set(h, new Set());
      hits.get(h).add(path.relative(SRC, file));
    }
  }
}
function walkFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) scanFile(full);
  }
}
walkFiles(SRC);

console.log('=== BROKEN STATIC LINKS (href with no matching page.tsx) ===');
if (hits.size === 0) console.log('(none)');
for (const [h, files] of [...hits.entries()].sort()) {
  console.log('  ' + h);
  for (const f of [...files].sort()) console.log('       <- ' + f);
}
