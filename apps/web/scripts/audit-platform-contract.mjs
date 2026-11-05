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
  const classGuardText = [...controllerCtx.matchAll(/@UseGuards\(([\s\S]*?)\)/g)].map((m) => m[1]).join(',');
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
    const verb = (verbMatch?.[1] ?? bareVerb?.[1]).toUpperCase();
    const path = verbMatch?.[2] ?? '';
    const full = [GLOBAL_PREFIX, prefix, path].filter(Boolean).join('/').replace(/\/+/g, '/');
    const roles = [...block.matchAll(/@Roles\(([^)]*)\)/g)].map((r) => r[1]);
    const guardText = [...block.matchAll(/@UseGuards\(([\s\S]*?)\)/g)].map((x) => x[1]).join(',') || classGuardText;
    routes.push({
      key: `${verb} /${full}`,
      verb,
      path: full,
      file: relative('..', file).replace(/\\/g, '/'),
      handler: m[2],
      roles: roles.length ? roles.join(',') : classRoles.join(','),
      // RolesGuard is NOT registered as an APP_GUARD in this app, so a route can
      // carry @Roles(...) and still let any authenticated user through. That
      // combination is the dangerous one and is reported as inert roles.
      rolesEnforced: /RolesGuard/.test(guardText),
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
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
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
    // apiFetch prefixes the base URL, which already carries the global route
    // prefix, so a page calling '/super-admin/plans' really hits /api/v1/...
    const hit = routeSet.get(`${verb} ${norm(`${GLOBAL_PREFIX}/${path}`)}`);
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
if (process.argv[2] === 'dump') {
  for (const r of routes.filter((x) => x.file.includes('super-admin')).slice(0, 12)) {
    console.log(`  key=${JSON.stringify(`${r.verb} ${norm(r.path)}`)} raw=${JSON.stringify(r.path)}`);
  }
}
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

console.log('\n=== PLATFORM ROUTES WITH WEAK OR MISSING AUTHZ METADATA ===');
const platform = routes.filter((r) => /^api\/v1\/(super-admin|dev-mode)\//.test(r.path));
const inert = platform.filter((r) => r.roles && !r.rolesEnforced);
const noRoles = platform.filter((r) => !r.roles);
const flaggedPublic = platform.filter((r) => r.public);
console.log(`  platform routes: ${platform.length}`);
console.log(`  @Roles present but RolesGuard NOT applied (any signed-in user passes): ${inert.length}`);
for (const r of inert) console.log(`    ${r.key}  roles=${r.roles}  (${r.file.split('/').pop()} :: ${r.handler})`);
console.log(`  no @Roles at all (any authenticated user passes): ${noRoles.length}`);
for (const r of noRoles) console.log(`    ${r.key}  (${r.file.split('/').pop()} :: ${r.handler})`);
console.log(`  marked @Public: ${flaggedPublic.length}`);
for (const r of flaggedPublic) console.log(`    ${r.key}  (${r.file.split('/').pop()} :: ${r.handler})`);

console.log('\n=== SUPER-ADMIN ROUTES NEVER CALLED FROM (platform) PAGES ===');
const calledNorm = new Set(live.map((l) => norm(`${GLOBAL_PREFIX}/${l.call.split(' ')[1]}`)));
for (const r of routes) {
  const n = norm(r.path);
  if (!calledNorm.has(n) && /super-admin|launch-readiness|backups|support-access|maintenance/.test(r.path)) {
    console.log(`  ${r.key}  (${r.file.split('/').pop()} :: ${r.handler})`);
  }
}
