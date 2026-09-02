import { describe, expect, it } from 'vitest';
import { formatSpaceChoice } from '../../src/utils/space-select.js';

describe('space-select', () => {
  it('formatSpaceChoice shows name, role, and current marker', () => {
    expect(
      formatSpaceChoice({
        id: 's1',
        name: 'Team A',
        type: 'team',
        subType: '',
        role: 'manager',
        selected: true,
      })
    ).toBe('Team A [manager] (current)');
  });

  it('formatSpaceChoice falls back to id when name is missing', () => {
    expect(
      formatSpaceChoice({
        id: 's2',
        name: '',
        type: 'team',
        subType: '',
        role: 'guest',
      })
    ).toBe('s2 [guest]');
  });
});
