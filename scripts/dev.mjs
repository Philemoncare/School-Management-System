import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = [
  {
    name: 'api',
    workspace: '@school/api',
    script: 'start:dev',
    url: 'http://localhost:4000/api/v1/health',
  },
  {
    name: 'web',
    workspace: '@school/web',
    script: 'dev',
    url: 'http://localhost:3000',
  },
];

let stopping = false;

async function isAlreadyRunning(service) {
  try {
    const response = await fetch(service.url, {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

function prefixOutput(stream, name, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`[${name}] ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer) target.write(`[${name}] ${buffer}\n`);
  });
}

function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {}
  }
}

const running = await Promise.all(services.map((service) => isAlreadyRunning(service)));
const pending = services.filter((_, index) => !running[index]);

for (let index = 0; index < services.length; index += 1) {
  if (running[index]) {
    console.log(`[${services[index].name}] already running at ${services[index].url}; reusing it.`);
  }
}

if (pending.length === 0) {
  console.log('All services are already running.');
  process.exit(0);
}

const children = pending.map(({ name, workspace, script }) => {
  const child = spawn(
    npm,
    ['run', script, `--workspace=${workspace}`],
    {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      detached: process.platform !== 'win32',
    },
  );

  prefixOutput(child.stdout, name, process.stdout);
  prefixOutput(child.stderr, name, process.stderr);

  child.on('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;
    console.error(
      `[${name}] exited${signal ? ` with ${signal}` : ` with code ${code ?? 1}`}. Stopping all services.`,
    );
    stop(code ?? 1);
  });

  return { name, pid: child.pid };
});

function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) killTree(child.pid);
  setTimeout(() => process.exit(code), 1500);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
