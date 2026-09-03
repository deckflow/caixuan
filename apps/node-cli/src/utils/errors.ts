import chalk from 'chalk';
import { APIError, type RequestDebugInfo } from '@caixuan-cc/sdk';

export function formatResponseBody(data: unknown): string {
  if (data === undefined || data === null) return '(empty)';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function formatApiDebugInfo(info: RequestDebugInfo): string[] {
  const lines: string[] = [];
  if (info.requestMethod) {
    lines.push(`${chalk.gray('VERB:')} ${info.requestMethod}`);
  }
  if (info.requestUrl) {
    lines.push(`${chalk.gray('URL:')} ${info.requestUrl}`);
  }
  if (info.requestPayload !== undefined) {
    lines.push(chalk.gray('Payload:'));
    lines.push(formatResponseBody(info.requestPayload));
  }
  return lines;
}

/** Print request verb/url/payload to stderr (used by `--debug` for every API call). */
export function outputRequestDebug(info: RequestDebugInfo, jsonMode = false): void {
  if (!info.requestMethod && !info.requestUrl && info.requestPayload === undefined) return;

  if (jsonMode) {
    const payload: Record<string, unknown> = { debug: true };
    if (info.requestMethod) payload.verb = info.requestMethod;
    if (info.requestUrl) payload.url = info.requestUrl;
    if (info.requestPayload !== undefined) payload.payload = info.requestPayload;
    console.error(JSON.stringify(payload));
    return;
  }

  for (const line of formatApiDebugInfo(info)) {
    console.error(line);
  }
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
