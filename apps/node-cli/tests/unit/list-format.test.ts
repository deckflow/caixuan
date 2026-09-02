import { describe, expect, it } from 'vitest';
import {
  DOC_COLUMNS,
  formatListRangeSummary,
  formatTable,
  formatTableWithSummary,
  MEMBER_COLUMNS,
  pickRowFields,
  SHARE_COLUMNS,
  SPACE_COLUMNS,
  trimListResult,
} from '../../src/utils/list-format.js';

describe('list-format', () => {
  it('pickRowFields keeps only selected columns', () => {
    const row = { id: 's1', name: 'Team A', role: 'manager', type: 'team', docNum: 3, extra: 'hidden' };
    expect(pickRowFields(row, SPACE_COLUMNS)).toEqual({
      id: 's1',
      name: 'Team A',
      role: 'manager',
      type: 'team',
      docNum: 3,
    });
    expect(pickRowFields(row, SPACE_COLUMNS)).not.toHaveProperty('extra');
  });

  it('trimListResult trims every row and preserves count', () => {
    const result = trimListResult(
      {
        count: 2,
        rows: [
          { id: 'd1', name: 'Deck', type: 'pptx', status: 'ready', secret: true },
          { id: 'd2', name: 'Notes', type: 'doc', status: 'draft', secret: false },
        ],
      },
      DOC_COLUMNS
    );

    expect(result.count).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ id: 'd1', name: 'Deck', type: 'pptx', status: 'ready' });
    expect(result.rows[0]).not.toHaveProperty('secret');
  });

  it('formatTable renders bordered grid with headers', () => {
    const rows = [
      { id: 'd1', name: 'Deck', type: 'pptx', status: 'ready' },
      { id: 'd2', name: 'Notes', type: 'doc', status: 'draft' },
    ];
    const output = formatTable(DOC_COLUMNS, rows);
    expect(output).toContain('┌');
    expect(output).toContain('┐');
    expect(output).toContain('├');
    expect(output).toContain('└');
    expect(output).toContain('│');
    expect(output).toContain('ID');
    expect(output).toContain('Name');
    expect(output.split('\n')).toHaveLength(6);
  });

  it('resolves member field aliases when trimming', () => {
    const row = { id: 'u1', name: 'Alice', role: 'teammate', memberStatus: 'active', mobile: '13800138000' };
    expect(pickRowFields(row, MEMBER_COLUMNS)).toEqual({
      userId: 'u1',
      name: 'Alice',
      role: 'teammate',
      status: 'active',
      mobile: '13800138000',
    });
  });

  it('formatTable aligns rows when name contains CJK characters', () => {
    const rows = [
      { id: 's1', name: 'Theme81', status: 'active', viewControl: 'public', createdAt: '2024-01-01' },
      { id: 's2', name: '一周规划四象限', status: 'active', viewControl: 'public', createdAt: '2024-01-02' },
      { id: 's3', name: '大班语言 《小猴卖圈》 希沃课件', status: 'active', viewControl: 'public', createdAt: '2024-01-03' },
    ];
    const output = formatTable(SHARE_COLUMNS, rows);
    const contentLines = output.split('\n').filter((line) => line.includes('│'));
    const barCounts = contentLines.map((line) => (line.match(/│/g) ?? []).length);
    expect(new Set(barCounts).size).toBe(1);
  });

  it('formatListRangeSummary describes total and current range', () => {
    expect(formatListRangeSummary(42, 0, 20)).toBe('共 42 条，当前显示第 1-20 条');
    expect(formatListRangeSummary(42, 20, 20)).toBe('共 42 条，当前显示第 21-40 条');
    expect(formatListRangeSummary(42, 40, 2)).toBe('共 42 条，当前显示第 41-42 条');
    expect(formatListRangeSummary(0, 0, 0)).toBe('共 0 条');
  });

  it('formatTableWithSummary appends range line after table', () => {
    const rows = [{ id: 'sh1', name: 'Demo', status: 'active', viewControl: 'public', createdAt: '2024-01-01' }];
    const output = formatTableWithSummary(SHARE_COLUMNS, rows, 42, 20);
    expect(output).toContain('└');
    expect(output).toContain('共 42 条，当前显示第 21-21 条');
  });

  it('formatTable truncates long names to keep columns readable', () => {
    const rows = [
      {
        id: 's1',
        name: '这是一个非常非常非常非常非常非常非常非常长的分享名称',
        status: 'active',
        viewControl: 'public',
        createdAt: '2024-01-01',
      },
    ];
    const output = formatTable(SHARE_COLUMNS, rows);
    expect(output).toContain('…');
  });
});
