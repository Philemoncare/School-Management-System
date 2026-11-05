// Temporary audit: find controlled inputs that can flip uncontrolled -> controlled.
// A `value={x.key}` with no ||/?? fallback is only a hazard when `key` is never
// established as a real property in this file's own form initializer.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.tsx')) files.push(p);
  }
};
walk('src');

const VALUE = /value=\{\s*([A-Za-z_]\w*)(?:\?\.|\.)((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)\s*\}/g;
const flagged = [];

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split(/\r?\n/);
  const bad = [];
  lines.forEach((line, i) => {
    if (/\|\||\?\?/.test(line)) return;
    let m;
    VALUE.lastIndex = 0;
    while ((m = VALUE.exec(line))) {
      const [, root, key] = m;
      if (!/form|filters|edit|data|row|draft|values|state/i.test(root)) continue;
      // Is this key ever written as a property in this file?
      const declared = new RegExp(`['"${key}']?\\s*:\\s*`, ).test(src) &&
        new RegExp(`(^|[{'",\\s])['"]?${key}['"]?\\s*:`, 'm').test(src);
      // Or set dynamically via a computed key / generic setter?
      const dynamic = new RegExp(`\\[\\s*(?:key|field|name|k)\\s*\\]`).test(src);
      if (!declared && !dynamic) bad.push({ line: i + 1, expr: `${root}.${key}` });
    }
  });
  if (bad.length) flagged.push({ f, bad });
}

for (const { f, bad } of flagged) {
  console.log(`\n${f}`);
  for (const b of bad) console.log(`  ${b.line}: value={${b.expr}}`);
}
console.log(`\nfiles=${files.length} suspectFiles=${flagged.length} suspectFields=${flagged.reduce((n, x) => n + x.bad.length, 0)}`);
