const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const envPath = join(process.cwd(), '.env');
const env = { ...process.env };

if (existsSync(envPath)) {
  const fs = require('node:fs');
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
}

const host = env.ANNORA_HOST || env.HOST || '127.0.0.1';
const port = env.ANNORA_PORT || env.PORT || '3000';
const nextBinary = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBinary, 'dev', '--hostname', host, '--port', String(port)], {
  stdio: 'inherit',
  env,
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to start ANNORA server:', error);
  process.exit(1);
});
