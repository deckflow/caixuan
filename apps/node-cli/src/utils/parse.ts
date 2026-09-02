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

export function collectIntegers(value: string, previous: number[]): number[] {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid integer: ${value}`);
  }
  return previous.concat([n]);
}

export function parseInteger(value: string, label: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be an integer`);
  }
  return n;
}

export function parseNullableJson(value: string, label: string): unknown {
  if (value === 'null') return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON or "null"`);
  }
}

export function parseBoolean(value: string, label: string): boolean {
  if (value === 'true' || value === 'yes') return true;
  if (value === 'false' || value === 'no') return false;
  throw new Error(`${label} must be true/false or yes/no`);
}
