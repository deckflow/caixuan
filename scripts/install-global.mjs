#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Strip pnpm-injected npm_config_* so nested `npm` won't warn on unknown keys. */
function cleanNpmEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^npm_config_/i.test(key)) delete env[key];
  }
  return env;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['--filter', '@caixuan-cc/cli...', 'build']);
const npmEnv = cleanNpmEnv();
// Remove stale global install so `caixuan` bin can be recreated without --force.
spawnSync('npm', ['uninstall', '-g', '@caixuan-cc/cli'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: npmEnv,
});
run('npm', ['install', '-g', './apps/node-cli'], { env: npmEnv });
