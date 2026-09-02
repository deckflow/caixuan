import { afterEach, describe, expect, it, vi } from 'vitest';
import { APIError } from '@caixuan-cc/sdk';
import { outputError } from '../../src/utils/errors.js';

describe('outputError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints request debug info when debug is enabled', () => {
    const error = new APIError(
      'API Error (404): Resource not found',
      404,
      { code: 'notFound', message: 'Resource not found' },
      'req-1',
      'notFound',
      'POST',
      'https://app.caixuan.cc/api/spaces/abc/docs',
      { spaceId: 'abc', fileId: 'file123' }
    );

    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    outputError(error, false, true);

    const output = stderr.mock.calls.flat().join('\n');
    expect(output).toContain('VERB:');
    expect(output).toContain('POST');
    expect(output).toContain('URL:');
    expect(output).toContain('https://app.caixuan.cc/api/spaces/abc/docs');
    expect(output).toContain('Payload:');
    expect(output).toContain('file123');
    expect(output).toContain('Response body:');
  });

  it('includes request debug info in json mode', () => {
    const error = new APIError(
      'API Error (404): Resource not found',
      404,
      { code: 'notFound' },
      'req-1',
      'notFound',
      'POST',
      'https://app.caixuan.cc/api/spaces/abc/docs',
      { fileId: 'file123' }
    );

    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    outputError(error, true, true);

    const payload = JSON.parse(String(stderr.mock.calls[0]?.[0]));
    expect(payload.verb).toBe('POST');
    expect(payload.url).toBe('https://app.caixuan.cc/api/spaces/abc/docs');
    expect(payload.payload).toEqual({ fileId: 'file123' });
  });
});
