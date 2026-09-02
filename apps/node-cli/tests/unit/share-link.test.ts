import { describe, expect, it } from 'vitest';
import {
  buildShareLinkUrl,
  extractMainDomainFromApiBase,
  getShareLinkId,
} from '../../src/utils/share-link.js';

describe('share link urls', () => {
  it('extracts main domain from app subdomain', () => {
    expect(extractMainDomainFromApiBase('https://app.caixuan.cc/api')).toBe('caixuan.cc');
    expect(extractMainDomainFromApiBase('https://app.cxdoc.cn/api/')).toBe('cxdoc.cn');
  });

  it('builds share link url', () => {
    expect(buildShareLinkUrl('https://app.caixuan.cc/api', 'abc123')).toBe('https://s.caixuan.cc/abc123');
  });

  it('extracts link id from share detail', () => {
    expect(getShareLinkId({ link: { id: 'link1' } })).toBe('link1');
    expect(() => getShareLinkId({})).toThrow('no link id');
    expect(() => getShareLinkId({ link: {} })).toThrow('no link id');
  });
});
