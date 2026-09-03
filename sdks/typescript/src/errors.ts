import type { AxiosError } from 'axios';
import type { RequestDebugInfo } from './types.js';

function tryHeaderValue(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === 'string' && v[0].trim()) return v[0].trim();
  return undefined;
}

function isRequestIdHeaderName(name: string): boolean {
  const n = name.trim().toLowerCase().replace(/_/g, '-');
  return n === 'x-request-id' || n === 'x-requestid' || n === 'request-id';
}

function extractRequestIdFromHeaders(headers: unknown): string | undefined {
  if (headers == null) return undefined;

  if (typeof (headers as { get?: (name: string) => unknown }).get === 'function') {
    const get = (headers as { get: (name: string) => unknown }).get.bind(headers);
    for (const name of ['x-request-id', 'X-Request-Id', 'request-id']) {
      const v = tryHeaderValue(get(name));
      if (v) return v;
    }
  }

  if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (isRequestIdHeaderName(key)) {
        const v = tryHeaderValue(value);
        if (v) return v;
      }
    }
  }

  return undefined;
}

function extractRequestIdFromBody(data: unknown): string | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  for (const key of ['requestId', 'request_id', 'traceId']) {
    const v = d[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function extractErrorMessage(data: unknown, fallback = 'Request failed'): string {
  if (data == null) return fallback;
  if (typeof data === 'string') return data.length > 500 ? `${data.slice(0, 500)}...` : data;
  if (typeof data === 'object') {
    const body = data as Record<string, unknown>;
    const candidate = body.message ?? body.error ?? body.msg;
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (typeof body.code === 'string' || typeof body.code === 'number') {
      const msg = body.message;
      if (typeof msg === 'string') return msg;
    }
  }
  return fallback;
}

export const RETRY_DELAYS_MS = [5000, 10000, 20000] as const;

export function getRetryDelaysMs(): readonly number[] {
  return RETRY_DELAYS_MS;
}

export function isRetriableHTTPStatus(status?: number): boolean {
  return status === 604 || status === 502;
}

export function isRetriableAxiosError(error: AxiosError): boolean {
  if (!error.response) {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK' ||
      error.message.toLowerCase().includes('network')
    );
  }
  return isRetriableHTTPStatus(error.response.status);
}

export function extractRequestDebugInfo(config?: {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
}): RequestDebugInfo {
  if (!config) return {};

  const method = config.method?.toUpperCase();
  const url = config.url;
  let payload: unknown;

  if (config.data !== undefined && config.data !== '') {
    if (typeof config.data === 'string') {
      try {
        payload = JSON.parse(config.data);
      } catch {
        payload = config.data;
      }
    } else {
      payload = config.data;
    }
  }

  if (config.params && typeof config.params === 'object' && Object.keys(config.params as object).length > 0) {
    payload =
      payload !== undefined ? { body: payload, params: config.params } : { params: config.params };
  }

  return { requestMethod: method, requestUrl: url, requestPayload: payload };
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseData?: unknown,
    public readonly requestId?: string,
    public readonly code?: string | number,
    public readonly requestMethod?: string,
    public readonly requestUrl?: string,
    public readonly requestPayload?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }

  static fromAxiosError(error: AxiosError): APIError {
    const status = error.response?.status;
    const data = error.response?.data;
    const requestId =
      extractRequestIdFromHeaders(error.response?.headers) ?? extractRequestIdFromBody(data);
    const errorMessage = extractErrorMessage(data, error.message || 'Unknown API error');
    const code =
      typeof data === 'object' && data !== null && 'code' in data
        ? (data as { code?: string | number }).code
        : undefined;
    const base = `API Error (${status ?? 'unknown'}): ${errorMessage}`;
    const message = requestId ? `${base} [X-RequestId: ${requestId}]` : base;
    const { requestMethod, requestUrl, requestPayload } = extractRequestDebugInfo(error.config);
    return new APIError(
      message,
      status,
      data,
      requestId,
      code,
      requestMethod,
      requestUrl,
      requestPayload
    );
  }

  static unauthorized(error: AxiosError): APIError {
    const requestId =
      extractRequestIdFromHeaders(error.response?.headers) ?? extractRequestIdFromBody(error.response?.data);
    const message = 'Authentication expired. Please log in again.';
    const { requestMethod, requestUrl, requestPayload } = extractRequestDebugInfo(error.config);
    return new APIError(
      requestId ? `${message} [X-RequestId: ${requestId}]` : message,
      401,
      error.response?.data,
      requestId,
      undefined,
      requestMethod,
      requestUrl,
      requestPayload
    );
  }
}

export function isRetriableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && (error as { isAxiosError?: boolean }).isAxiosError) {
    return isRetriableAxiosError(error as AxiosError);
  }
  if (error instanceof APIError) {
    return typeof error.statusCode === 'number' ? isRetriableHTTPStatus(error.statusCode) : false;
  }
  return false;
}
