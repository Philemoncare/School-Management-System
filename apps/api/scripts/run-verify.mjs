/**
 * Runs the Phase 5 verification against a server this script owns.
 *
 * Starting the API in a shared terminal proved unreliable here: the next
 * command reused the shell and the server died mid-run, which looks exactly
 * like a broken endpoint but isn't. So spawn it, wait for a real TCP answer,
 * run the checks, then stop it and report both exit codes.
 *
 *   node scripts/run-verify.mjs
 */
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
require('dotenv').config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const PORT = Number(process.env.PORT || 4000);
const PROBE_URL = `http://127.0.0.1:${PORT}/api/v1/super-admin/dashboard/metrics`;

// If something is already listening, it may be an older build — verifying it
// would produce a green result about code that is no longer on disk.
const preexisting = await fetch(PROBE_URL).catch(() => null);
if (preexisting && !process.env.ALLOW_EXISTING) {
  console.log(`[run-verify] port ${PORT} is already serving (status ${preexisting.status}).`);
  console.log('[run-verify] stop that process first, or re-run with ALLOW_EXISTING=1 to test it.');
  process.exit(2);
}

const child = preexisting
  ? null
  : spawn(
      process.execPath,
      ['--enable-source-maps', 'dist/src/main'],
      { cwd: join(dirname(fileURLToPath(import.meta.url)), '..'), stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
    );

const serverLog = [];
const capture = (chunk) => {
  const text = String(chunk);
  serverLog.push(text);
  if (process.env.VERBOS) process.stdout.write(text);
};
if (child) {
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  child.on('exit', (code) => console.log(`[run-verify] server exited with code ${code}`));
}

async function waitForServer(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // Any HTTP answer counts: this route is meant to reject an anonymous
      // caller, and 401 proves the listener and the auth guard are both live.
      const res = await fetch(PROBE_URL);
      return res.status;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

let exitCode = 1;
try {
  const status = preexisting ? preexisting.status : await waitForServer();
  if (!status) {
    console.log('[run-verify] server never answered. Last server output:');
    console.log(serverLog.join('').slice(-3000));
  } else {
    console.log(`[run-verify] server live (anonymous probe -> ${status})\n`);
    const run = spawnSync(process.execPath, ['scripts/super-admin-verify.mjs'], {
      cwd: join(dirname(fileURLToPath(import.meta.url)), '..'),
      stdio: 'inherit',
      env: process.env,
    });
    exitCode = run.status ?? 1;
  }
} finally {
  if (child) {
    child.kill('SIGTERM');
    // Windows does not honour SIGTERM for node, so give it a moment then force.
    setTimeout(() => child.kill('SIGKILL'), 4000).unref();
  }
}
process.exit(exitCode);
