import { describe, expect, it } from 'vitest';
import {
  addDocToShareContent,
  buildShareModifyPayload,
  getShareContent,
  hasShareModifyFields,
  removeDocFromShareContent,
} from '../../src/utils/share-payload.js';

describe('buildShareModifyPayload', () => {
  it('builds payload from individual options', () => {
    const payload = buildShareModifyPayload({
      name: 'Demo',
      viewControl: 'password',
      password: '1234',
      needPhone: 'yes',
      doc: ['doc1', 'doc2'],
      price: '9900',
      isSecrecy: 'yes',
      expiredAt: 'null',
    });

    expect(payload).toEqual({
      name: 'Demo',
      viewControl: 'password',
      password: '1234',
      needPhone: 'yes',
      content: [
        { _type: 'doc', id: 'doc1' },
        { _type: 'doc', id: 'doc2' },
      ],
      price: 9900,
      isSecrecy: true,
      expiredAt: null,
    });
  });

  it('prefers --content over --doc', () => {
    const payload = buildShareModifyPayload({
      content: '[{"_type":"divider","name":"Section"}]',
      doc: ['doc1'],
    });

    expect(payload.content).toEqual([{ _type: 'divider', name: 'Section' }]);
  });

  it('detects empty payload', () => {
    expect(hasShareModifyFields({})).toBe(false);
    expect(hasShareModifyFields({ name: 'x' })).toBe(true);
  });
});

describe('share content helpers', () => {
  const content = [
    { _type: 'doc' as const, id: 'doc1' },
    { _type: 'divider' as const, name: 'Section' },
    { _type: 'doc' as const, id: 'doc2' },
  ];

  it('extracts content from share detail', () => {
    expect(getShareContent({ content })).toEqual(content);
    expect(getShareContent({})).toEqual([]);
    expect(getShareContent({ content: null })).toEqual([]);
  });

  it('adds a document to content', () => {
    expect(addDocToShareContent(content, 'doc3')).toEqual([
      ...content,
      { _type: 'doc', id: 'doc3' },
    ]);
  });

  it('rejects duplicate document on add', () => {
    expect(() => addDocToShareContent(content, 'doc1')).toThrow('already in the share');
  });

  it('removes a document from content', () => {
    expect(removeDocFromShareContent(content, 'doc1')).toEqual([
      { _type: 'divider', name: 'Section' },
      { _type: 'doc', id: 'doc2' },
    ]);
  });

  it('rejects missing document on remove', () => {
    expect(() => removeDocFromShareContent(content, 'doc9')).toThrow('not in the share');
  });
});
