import { readFile } from 'fs/promises';

export async function readJsonBody(value: string): Promise<Record<string, unknown>> {
  const raw = value.startsWith('@') ? await readFile(value.slice(1), 'utf-8') : value;
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

export function parsePositiveInteger(value: string, label: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return n;
}

export function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
