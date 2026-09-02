import { describe, expect, it } from 'vitest';
import {
  applyBasicAuthToUrl,
  buildLoginUrl,
  maskBasicAuthInUrl,
  normalizeLoginBase,
} from '../../src/core/auth.js';

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

  it('embeds nginx basic auth into login url', () => {
    const url = buildLoginUrl('https://app.cxdoc.cn/api', 'http://localhost:3737', 'tester:secret');
    expect(url).toContain('tester:secret@');
    expect(maskBasicAuthInUrl(url)).toContain('tester:***@');
  });
});
