import axios, { AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APIError } from '../../src/errors.js';
import { createCaixuan, DEFAULT_ROOT } from '../../src/index.js';

describe('@caixuan/sdk', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('creates client with default root', () => {
    const client = createCaixuan();
    expect(client.root).toBe(DEFAULT_ROOT);
  });

  it('sends user token via X-Auth-Token header', async () => {
    const client = createCaixuan({
      root: 'http://localhost:3000/api',
      token: 'user_test-token',
    });

    mock.onGet('http://localhost:3000/api/session').reply((config) => {
      expect(config.headers?.['X-Auth-Token']).toBe('user_test-token');
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { id: 'user-1' }];
    });

    await client.session.get();
  });

  it('sends nginx basic auth via Authorization header', async () => {
    const client = createCaixuan({
      root: 'http://localhost:3000/api',
      token: 'user_test-token',
      basicAuth: 'tester:secret',
    });

    mock.onGet('http://localhost:3000/api/session').reply((config) => {
      expect(config.headers?.Authorization).toBe(
        `Basic ${Buffer.from('tester:secret', 'utf8').toString('base64')}`
      );
      expect(config.headers?.['X-Auth-Token']).toBe('user_test-token');
      return [200, { id: 'user-1' }];
    });

    await client.session.get();
  });

  it('wraps API errors with code', () => {
    const err = new APIError('failed', 403, { code: 'NOT_ALLOWED', message: 'denied' }, 'req-1', 'NOT_ALLOWED');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('NOT_ALLOWED');
    expect(err.requestId).toBe('req-1');
  });

  it('captures request context from axios errors', () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Request failed with status code 404',
      config: {
        method: 'post',
        url: 'https://app.caixuan.cc/api/spaces/abc/docs',
        data: JSON.stringify({ spaceId: 'abc', fileId: 'file123', name: 'demo.pptx' }),
      },
      response: {
        status: 404,
        data: { code: 'notFound', message: 'Resource not found' },
        headers: { 'x-request-id': 'req-debug-1' },
      },
    } as AxiosError;

    const err = APIError.fromAxiosError(axiosError);
    expect(err.requestMethod).toBe('POST');
    expect(err.requestUrl).toBe('https://app.caixuan.cc/api/spaces/abc/docs');
    expect(err.requestPayload).toEqual({ spaceId: 'abc', fileId: 'file123', name: 'demo.pptx' });
    expect(err.requestId).toBe('req-debug-1');
  });

  it('invokes onRequestDebug for every request', async () => {
    const seen: Array<{ requestMethod?: string; requestUrl?: string; requestPayload?: unknown }> = [];
    const client = createCaixuan({
      root: 'http://localhost:3000/api',
      token: 'user_test-token',
      onRequestDebug: (info) => seen.push(info),
    });

    mock.onGet('http://localhost:3000/api/session').reply(200, { id: 'user-1' });
    await client.session.get();

    expect(seen).toHaveLength(1);
    expect(seen[0]?.requestMethod).toBe('GET');
    expect(seen[0]?.requestUrl).toBe('http://localhost:3000/api/session');
  });
});
