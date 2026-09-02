import chalk from 'chalk';
import stringWidth from 'string-width';
import type { Context } from '../context.js';

const BOX = {
  topLeft: '┌',
  topJoin: '┬',
  topRight: '┐',
  midLeft: '├',
  midJoin: '┼',
  midRight: '┤',
  botLeft: '└',
  botJoin: '┴',
  botRight: '┘',
  horizontal: '─',
  vertical: '│',
} as const;

export type ListColumn = {
  key: string;
  label: string;
  maxWidth?: number;
  get?: (row: Record<string, unknown>) => unknown;
};

export type ListResultLike = {
  rows: unknown[];
  count: number;
};

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getField(row: Record<string, unknown>, column: ListColumn): unknown {
  if (column.get) return column.get(row);
  return row[column.key];
}

export function pickRowFields(row: Record<string, unknown>, columns: ListColumn[]): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const column of columns) {
    const value = getField(row, column);
    if (value !== undefined && value !== null && value !== '') {
      picked[column.key] = value;
    }
  }
  return picked;
}

export function trimListResult(result: ListResultLike, columns: ListColumn[]): ListResultLike {
  return {
    count: result.count,
    rows: (result.rows as Array<Record<string, unknown>>).map((row) => pickRowFields(row, columns)),
  };
}

function stripAnsi(text: string): string {
  return text.replace(/\u001B\[[0-9;]*m/g, '');
}

function visibleLength(text: string): number {
  return stringWidth(stripAnsi(text));
}

function truncateToWidth(text: string, maxWidth: number): string {
  if (visibleLength(text) <= maxWidth) return text;
  const ellipsis = '…';
  let result = '';
  for (const char of text) {
    const next = result + char;
    if (visibleLength(next + ellipsis) > maxWidth) break;
    result = next;
  }
  return result + ellipsis;
}

function formatCellValue(value: string, maxWidth?: number): string {
  if (maxWidth === undefined) return value;
  return truncateToWidth(value, maxWidth);
}

function padCell(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - visibleLength(text)));
}

function horizontalLine(widths: number[], left: string, join: string, right: string): string {
  return left + widths.map((width) => BOX.horizontal.repeat(width + 2)).join(join) + right;
}

function formatRow(cells: string[], widths: number[]): string {
  return (
    BOX.vertical +
    cells.map((cell, index) => ` ${padCell(cell, widths[index]!)} `).join(BOX.vertical) +
    BOX.vertical
  );
}

function styleCell(column: ListColumn, value: string): string {
  if (column.key === 'id' || column.key === 'userId') {
    return chalk.cyan(value);
  }
  if (column.key === 'status' && /active|online|ready/i.test(value)) {
    return chalk.green(value);
  }
  if (column.key === 'selected' && value === 'true') {
    return chalk.green(value);
  }
  return value;
}

export function formatListRangeSummary(total: number, start: number, rowCount: number): string {
  if (rowCount === 0) {
    return `共 ${total} 条`;
  }
  const from = start + 1;
  const to = start + rowCount;
  return `共 ${total} 条，当前显示第 ${from}-${to} 条`;
}

export function formatTableWithSummary(
  columns: ListColumn[],
  rows: Array<Record<string, unknown>>,
  total: number,
  start: number
): string {
  const summary = chalk.dim(formatListRangeSummary(total, start, rows.length));
  if (rows.length === 0) {
    return summary;
  }
  return `${formatTable(columns, rows)}\n${summary}`;
}

export function formatTable(columns: ListColumn[], rows: Array<Record<string, unknown>>): string {
  const rawRows = rows.map((row) =>
    columns.map((column) => formatCellValue(cellValue(getField(row, column)), column.maxWidth))
  );

  const widths = columns.map((column, columnIndex) => {
    const label = formatCellValue(column.label, column.maxWidth);
    const values = [label, ...rawRows.map((row) => row[columnIndex]!)];
    return Math.max(...values.map((value) => visibleLength(value)), 0);
  });

  const headerCells = columns.map((column, index) =>
    padCell(chalk.bold.cyan(formatCellValue(column.label, column.maxWidth)), widths[index]!)
  );
  const dataRows = rawRows.map((row) =>
    columns.map((column, index) => padCell(styleCell(column, row[index]!), widths[index]!))
  );

  return [
    horizontalLine(widths, BOX.topLeft, BOX.topJoin, BOX.topRight),
    formatRow(headerCells, widths),
    horizontalLine(widths, BOX.midLeft, BOX.midJoin, BOX.midRight),
    ...dataRows.map((cells) => formatRow(cells, widths)),
    horizontalLine(widths, BOX.botLeft, BOX.botJoin, BOX.botRight),
  ].join('\n');
}

export const SPACE_COLUMNS: ListColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name', maxWidth: 36 },
  { key: 'role', label: 'Role' },
  { key: 'type', label: 'Type' },
  { key: 'docNum', label: 'Docs' },
  { key: 'selected', label: 'Selected' },
];

export const MEMBER_COLUMNS: ListColumn[] = [
  { key: 'userId', label: 'User ID', get: (row) => row.userId ?? row.id },
  { key: 'name', label: 'Name', maxWidth: 36 },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status', get: (row) => row.status ?? row.memberStatus },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
];

export const DOC_COLUMNS: ListColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name', maxWidth: 36 },
  { key: 'type', label: 'Type', get: (row) => row.type ?? row.fileType },
  { key: 'status', label: 'Status' },
  {
    key: 'updatedAt',
    label: 'Updated',
    get: (row) => row.updatedAt ?? row.modifiedAt,
  },
  {
    key: 'creator',
    label: 'Creator',
    maxWidth: 20,
    get: (row) => {
      const creator = row.creator;
      if (creator && typeof creator === 'object' && 'name' in creator) {
        return (creator as { name?: string }).name;
      }
      return row.creatorName;
    },
  },
];

export const SHARE_COLUMNS: ListColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name', maxWidth: 36 },
  { key: 'status', label: 'Status' },
  { key: 'viewControl', label: 'View Control' },
  { key: 'createdAt', label: 'Created' },
  {
    key: 'needPhone',
    label: 'Need Phone',
    get: (row) => row.needPhone ?? row.needMobile,
  },
];

export function outputListResult(
  ctx: Context,
  result: ListResultLike,
  columns: ListColumn[],
  options: {
    table?: boolean;
    emptyMessage?: string;
    start?: number;
  } = {}
): void {
  const trimmed = trimListResult(result, columns);
  const emptyMessage = options.emptyMessage ?? 'No items found.';
  const start = options.start ?? 0;

  ctx.output(
    trimmed,
    options.table
      ? (data) => {
          const { rows, count } = data as ListResultLike;
          const typedRows = rows as Array<Record<string, unknown>>;
          if (typedRows.length === 0) {
            return `${emptyMessage}\n${chalk.dim(formatListRangeSummary(count, start, 0))}`;
          }
          return formatTableWithSummary(columns, typedRows, count, start);
        }
      : undefined,
    { count: result.count }
  );
}

export function outputSpaceList(ctx: Context, result: ListResultLike, table?: boolean): void {
  outputListResult(ctx, result, SPACE_COLUMNS, {
    table,
    emptyMessage: 'No spaces found.',
  });
}
