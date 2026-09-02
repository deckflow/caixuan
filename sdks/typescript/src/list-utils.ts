import type { ListResult } from './types.js';

export function parseListResult<T>(data: unknown, headers: Record<string, unknown>): ListResult<T> {
  if (Array.isArray(data)) {
    const total = headers['x-content-record-total'] ?? headers['X-Content-Record-Total'];
    return { rows: data as T[], count: total != null ? Number(total) : data.length };
  }
  if (typeof data === 'object' && data !== null && 'rows' in data) {
    const obj = data as ListResult<T>;
    return { rows: obj.rows, count: obj.count ?? obj.rows.length };
  }
  return { rows: [], count: 0 };
}
