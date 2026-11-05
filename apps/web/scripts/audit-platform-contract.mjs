/**
 * Platform Super Admin contract auditor.
 *
 * Answers one question mechanically, for every page under apps/web/src/app/(platform):
 * does the call this button makes correspond to a route this API actually serves?
 *
 * It parses Nest decorators to build the real route table (prefix + verb + path,
 * with the guard/role metadata that protects it), parses the frontend apiFetch
 * calls, then diffs them. Template literals and `:param` segments are normalized
 * to a common shape so `/schools/${id}` matches `schools/:id`.
 *
 * Run from apps/web: node scripts/audit-platform-contract.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join('..', '..', 'apps', 'api', 'src');
const WEB_PAGES = join('src', 'app', '(platform)');
const GLOBAL_PREFIX = 'api/v1';

const tsFiles = (dir) => {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith('.ts')) out.push(p);
    }
  };
  walk(dir);
  return out;
};

// ---------------------------------------------------------------------------
// 1. Backend route table
// ---------------------------------------------------------------------------

const VERBS = { Get: 'GET', Post: 'POST', Patch: 'PATCH', Put: 'PUT', Delete: 'DELETE' };
const routes = [];

for (const file of tsFiles(API_SRC)) {
  const src = readFileSync(file, 'utf8');
  const ctrl = src.match(/@Controller\(\s*(?:\{\s*)?path:\s*['"]([^'"]*)['"]|(?:@Controller\(\s*['"]([^'"]*)['"]\s*\))/);
  if (!ctrl) continue;
  const prefix = (ctrl[1] ?? ctrl[2] ?? '').replace(/^\//, '');

  // Controller-level protection, inherited by every route in the class.
  const classHead = src.slice(0, src.lastIndexOf('@Controller'));
  const controllerCtx = classHead.slice(Math.max(0, classHead.lastIndexOf('@Injectable')));
  const classRoles = [...controllerCtx.matchAll(/@Roles\(([^)]*)\)/g)].map((m) => m[1]);
  const classGuarded = /@UseGuards\(/.test(controllerCtx);
  const classPublic = /@Public\(\)/.test(controllerCtx);

  // Method decorators: capture the decorator block preceding each async method.
  const methodRe =
    /((?:@[A-Za-z][\w.]*(?:\([\s\S]*?\))?\s*)+)\s*(?:private\s+|readonly\s+)?(?:async\s+)?(\w+)\s*\(/g;
  let m;
  while ((m = methodRe.exec(src))) {
    const block = m[1];
    const verbMatch = block.match(/@(Get|Post|Patch|Put|Delete)\(\s*(?:\{\s*)?(?:path:\s*)?['"]([^'"]*)['"]?/);
    const bareVerb = !verbMatch && block.match(/@(Get|Post|Patch|Put|Delete)\(\s*\)/);
    if (!verbMatch && !bareVerb) continue;
    const verb = VERBS[(verbMatch?.[1] ?? bareVerb?.[1]).toUpperCase()];
    const path = verbMatch?.[2] ?? '';
    const full = [GLOBAL_PREFIX, prefix, path].filter(Boolean).join('/').replace(/\/+/g, '/');
    const roles = [...block.matchAll(/@Roles\(([^)]*)\)/g)].map((r) => r[1]);
    routes.push({
      key: `${verb} /${full}`,
      verb,
      path: full,
      file: relative('..', file).replace(/\\/g, '/'),
      handler: m[2],
      roles: roles.length ? roles.join(',') : classRoles.join(','),
      guarded: /@UseGuards\(/.test(block) || classGuarded,
      public: /@Public\(\)/.test(block) || classPublic,
    });
  }
}

// ---------------------------------------------------------------------------
// 2. Frontend calls
// ---------------------------------------------------------------------------

const norm = (p) =>
  p
    .replace(/\$\{[^}]*\}/g, ':p')
    .replace(/:[A-Za-z_][\w-]*/g, ':p')
    .replace(/^\//, '')
    .replace(/\/+$/, '')
    .split('?')[0];

const routeSet = new Map(routes.map((r) => [`${r.verb} ${norm(r.path)}`, r]));
const callRe = /apiFetch(\w*)\(\s*[`'"]([^`'"]*)[`'"]([\s\S]{0,220}?)\)/g;

const pages = [];
const walkPages = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walkPages(p);
    else if (n.endsWith('.tsx')) pages.push(p);
  }
};
walkPages(WEB_PAGES);

const dead = [];
const live = [];
const untrustedMethod = [];

for (const file of pages) {
  const src = readFileSync(file, 'utf8');
  const rel = relative('src', file).replace(/\\/g, '/');
  let m;
  callRe.lastIndex = 0;
  while ((m = callRe.exec(src))) {
    const [, helper, rawPath, tail] = m;
    if (helper && helper !== 'Raw') continue; // only plain apiFetch + apiFetchRaw hit REST
    const verbMatch = tail.match(/method:\s*['"](\w+)['"]/);
    const verb = (verbMatch?.[1] ?? 'GET').toUpperCase();
    const path = rawPath.replace(/^\//, '');
    const line = src.slice(0, m.index).split('\n').length;
    const hit = routeSet.get(`${verb} ${norm(path)}`);
    const rec = { rel, line, call: `${verb} /${path}`, file: rel };
    if (!hit) dead.push(rec);
    else {
      live.push({ ...rec, route: hit.key, handler: hit.handler });
      // A mutating call hitting a route with no guard/role metadata is a hole.
      if (verb !== 'GET' && (!hit.guarded || !hit.roles)) {
        untrustedMethod.push({ ...rec, handler: hit.handler, route: hit.key, roles: hit.roles, guarded: hit.guarded });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Report
// ---------------------------------------------------------------------------

console.log(`backend routes: ${routes.length}`);
console.log(`frontend calls matched: ${live.length}, unmatched: ${dead.length}\n`);

console.log('=== DEAD ACTIONS (frontend calls with no matching API route) ===');
const byFile = new Map();
for (const d of dead) {
  if (!byFile.has(d.rel)) byFile.set(d.rel, []);
  byFile.get(d.rel).push(d);
}
if (!byFile.size) console.log('  (none)');
for (const [f, list] of byFile) {
  console.log(`  ${f}`);
  for (const x of list) console.log(`    line ${x.line}: ${x.call}`);
}

console.log('\n=== MUTATING ROUTES WITHOUT ROLES/GUARD METADATA ===');
if (!untrustedMethod.length) console.log('  (none)');
for (const u of untrustedMethod) {
  console.log(`  ${u.route}  ->  ${u.file.split('/').pop()}:${u.line}  guarded=${u.guarded} roles=${u.roles || 'NONE'}`);
}

console.log('\n=== SUPER-ADMIN ROUTES NEVER CALLED FROM (platform) PAGES ===');
const usedKeys = new Set(live.map((l) => `${l.route.verb ?? ''}`));
const calledNorm = new Set(live.map((l) => l.call));
for (const r of routes) {
  const n = norm(r.path);
  const seen = [...calledNorm].some((c) => c.endsWith(n.replace(/^api\/v1\//, '')));
  if (!seen && /super-admin|launch-readiness|backups|support-access|maintenance/.test(r.path)) {
    console.log(`  ${r.key}  (${r.file.split('/').pop()} :: ${r.handler})`);
  }
}
