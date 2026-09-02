import { describe, expect, it } from 'vitest';
import { APIError } from '../../src/errors.js';
import { createCaixuan, DEFAULT_ROOT } from '../../src/index.js';

describe('@caixuan/sdk', () => {
  it('creates client with default root', () => {
    const client = createCaixuan();
    expect(client.root).toBe(DEFAULT_ROOT);
  });

  it('wraps API errors with code', () => {
    const err = new APIError('failed', 403, { code: 'NOT_ALLOWED', message: 'denied' }, 'req-1', 'NOT_ALLOWED');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('NOT_ALLOWED');
    expect(err.requestId).toBe('req-1');
  });
});
