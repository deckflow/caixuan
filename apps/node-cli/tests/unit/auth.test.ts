import { describe, expect, it } from 'vitest';
import { buildLoginUrl, normalizeLoginBase } from '../../src/core/auth.js';

describe('auth urls', () => {
  it('strips /api suffix for web login', () => {
    expect(normalizeLoginBase('https://app.caixuan.cc/api/')).toBe('https://app.caixuan.cc');
  });

  it('builds cli auth redirect url', () => {
    const url = buildLoginUrl('https://app.caixuan.cc/api', 'http://localhost:3737');
    expect(url).toBe(
      'https://app.caixuan.cc/cli/auth?redirect_url=' + encodeURIComponent('http://localhost:3737')
    );
  });
});
