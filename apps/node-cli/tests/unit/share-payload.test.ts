import { describe, expect, it } from 'vitest';
import { buildShareModifyPayload, hasShareModifyFields } from '../../src/utils/share-payload.js';

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
