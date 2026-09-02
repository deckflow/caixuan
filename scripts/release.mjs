#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Publish order: SDK first, then CLI (depends on SDK). */
const PACKAGES = [
  { dir: 'sdks/typescript', name: '@caixuan-cc/sdk' },
  { dir: 'apps/node-cli', name: '@caixuan-cc/cli' },
];

const NPM_REGISTRY = 'https://registry.npmjs.org';
const GITHUB_REGISTRY = 'https://npm.pkg.github.com/';

/** Strip pnpm-injected npm_config_* so nested `npm` won't warn on unknown keys. */
function cleanNpmEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^npm_config_/i.test(key)) delete env[key];
  }
  return env;
}

function parseArgs(argv) {
  const hasFlag = (flag) => argv.includes(flag);
  const flagValue = (flag) => {
    const entry = argv.find((arg) => arg.startsWith(`${flag}=`));
    if (entry) return entry.slice(flag.length + 1);
    const index = argv.indexOf(flag);
    if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith('--')) {
      return argv[index + 1];
    }
    return undefined;
  };

  const hasNpmFlag = hasFlag('--npm') || argv.some((arg) => arg.startsWith('--npm='));
  const hasGithubFlag = hasFlag('--github');

  const useGithub = hasGithubFlag && !hasNpmFlag;
  const npmTag = flagValue('--npm') || 'latest';

  return {
    target: useGithub ? 'github' : 'npm',
    tag: npmTag,
  };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: cleanNpmEnv(),
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: cleanNpmEnv(),
  });
}

function readLocalVersion(packageDir) {
  const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
  return pkg.version;
}

function getPublishedVersion(packageName, registry) {
  const result = runCapture('npm', ['view', packageName, 'version', `--registry=${registry}`], root);
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function publishPackage(packageDir, { target, tag }) {
  const cwd = resolve(root, packageDir);
  const publishArgs = ['publish'];

  if (target === 'github') {
    publishArgs.push(`--registry=${GITHUB_REGISTRY}`);
  } else {
    publishArgs.push(
      `--@deckflow:registry=${NPM_REGISTRY}`,
      '--access=public',
      '--tag',
      tag,
    );
  }

  run('npm', publishArgs, { cwd });
}

function main() {
  const options = parseArgs(process.argv);

  console.log(`Release target: ${options.target}${options.target === 'npm' ? ` (tag: ${options.tag})` : ''}`);
  console.log('Building packages...');
  run('pnpm', ['-r', '--sort', 'build']);

  const registry = options.target === 'github' ? GITHUB_REGISTRY : NPM_REGISTRY;

  for (const { dir, name } of PACKAGES) {
    const localVersion = readLocalVersion(resolve(root, dir));
    const publishedVersion = getPublishedVersion(name, registry);

    if (publishedVersion === localVersion) {
      console.log(`Skip ${name}@${localVersion}: already published on ${options.target}`);
      continue;
    }

    console.log(`Publishing ${name}@${localVersion}...`);
    publishPackage(dir, options);
    console.log(`Published ${name}@${localVersion}`);
  }

  console.log('Release complete.');
}

main();
