import chalk from 'chalk';
import { APIError } from '@caixuan/sdk';

export function formatResponseBody(data: unknown): string {
  if (data === undefined || data === null) return '(empty)';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function outputError(error: Error | APIError, jsonMode: boolean): void {
  if (jsonMode) {
    const errorObj: Record<string, unknown> = {
      error: error.message,
      code: error.name,
    };
    if (error instanceof APIError) {
      if (error.requestId) errorObj.requestId = error.requestId;
      if (error.responseData !== undefined) errorObj.body = error.responseData;
    }
    console.error(JSON.stringify(errorObj, null, 2));
    return;
  }

  console.error(chalk.red(`Error: ${error.message}`));
  if (error instanceof APIError && error.responseData !== undefined) {
    console.error(chalk.gray('Response body:'));
    console.error(formatResponseBody(error.responseData));
  }
}

export const ExitCode = {
  SUCCESS: 0,
  ERROR: 1,
  USAGE_ERROR: 2,
  UNAUTHORIZED: 3,
} as const;
