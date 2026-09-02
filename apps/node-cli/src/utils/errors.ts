import chalk from 'chalk';
import { APIError } from '@caixuan-cc/sdk';

export function formatResponseBody(data: unknown): string {
  if (data === undefined || data === null) return '(empty)';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function formatApiDebugInfo(error: APIError): string[] {
  const lines: string[] = [];
  if (error.requestMethod) {
    lines.push(`${chalk.gray('VERB:')} ${error.requestMethod}`);
  }
  if (error.requestUrl) {
    lines.push(`${chalk.gray('URL:')} ${error.requestUrl}`);
  }
  if (error.requestPayload !== undefined) {
    lines.push(chalk.gray('Payload:'));
    lines.push(formatResponseBody(error.requestPayload));
  }
  return lines;
}

export function outputError(error: Error | APIError, jsonMode: boolean, debug = false): void {
  if (jsonMode) {
    const errorObj: Record<string, unknown> = {
      error: error.message,
      code: error.name,
    };
    if (error instanceof APIError) {
      if (error.requestId) errorObj.requestId = error.requestId;
      if (error.responseData !== undefined) errorObj.body = error.responseData;
      if (debug) {
        if (error.requestMethod) errorObj.verb = error.requestMethod;
        if (error.requestUrl) errorObj.url = error.requestUrl;
        if (error.requestPayload !== undefined) errorObj.payload = error.requestPayload;
      }
    }
    console.error(JSON.stringify(errorObj, null, 2));
    return;
  }

  console.error(chalk.red(`Error: ${error.message}`));
  if (error instanceof APIError) {
    if (debug) {
      for (const line of formatApiDebugInfo(error)) {
        console.error(line);
      }
    }
    if (error.responseData !== undefined) {
      console.error(chalk.gray('Response body:'));
      console.error(formatResponseBody(error.responseData));
    }
  }
}

export const ExitCode = {
  SUCCESS: 0,
  ERROR: 1,
  USAGE_ERROR: 2,
  UNAUTHORIZED: 3,
} as const;
