import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilesApi } from '../../src/files.js';
import type { HttpClient } from '../../src/http-client.js';
import { DEFAULT_CHUNK_SIZE } from '../../src/types.js';

describe('FilesApi.upload', () => {
  let mock: MockAdapter;
  let http: Pick<HttpClient, 'post' | 'resolveSpaceId'>;
  let files: FilesApi;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    http = {
      resolveSpaceId: vi.fn(async () => 'space-1'),
      post: vi.fn(),
    };
    files = new FilesApi(http as HttpClient);
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('uploads small files with a single PUT', async () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    vi.mocked(http.post).mockResolvedValue({
      data: [
        {
          id: 'file-1',
          key: 'files/demo.bin',
          auth: {
            url: 'https://oss.example/upload',
            headers: { 'x-oss-date': 'now' },
            Authorization: 'OSS token',
          },
          platform: 'oss',
        },
      ],
    } as never);

    mock.onPut('https://oss.example/upload').reply(200);

    const result = await files.upload(data, { name: 'demo.bin' });

    expect(result.id).toBe('file-1');
    expect(mock.history.put).toHaveLength(1);
    expect(mock.history.post).toHaveLength(0);
  });

  it('completes multipart uploads after all parts are uploaded', async () => {
    const partSize = DEFAULT_CHUNK_SIZE;
    const data = new Uint8Array(partSize + 1);
    data.fill(7);

    vi.mocked(http.post).mockResolvedValue({
      data: [
        {
          id: 'file-2',
          key: 'files/large.bin',
          multipart: true,
          multipartPartSize: partSize,
          platform: 'oss',
          cloudPlatform: 'ali',
          auth: {
            url: 'https://oss.example/complete',
            headers: { 'Content-Type': 'application/xml' },
            Authorization: 'OSS complete-token',
          },
          multipartPartAuths: [
            {
              partNumber: 1,
              url: 'https://oss.example/part/1',
              headers: { 'Content-Type': 'application/octet-stream' },
              Authorization: 'OSS part-1',
            },
            {
              partNumber: 2,
              url: 'https://oss.example/part/2',
              headers: { 'Content-Type': 'application/octet-stream' },
              Authorization: 'OSS part-2',
            },
          ],
        },
      ],
    } as never);

    mock.onPut('https://oss.example/part/1').reply(200, '', { etag: '"etag-1"' });
    mock.onPut('https://oss.example/part/2').reply(200, '', { etag: '"etag-2"' });
    mock.onPost('https://oss.example/complete').reply((config) => {
      expect(config.data).toBe(
        [
          '<CompleteMultipartUpload>',
          '<Part><PartNumber>1</PartNumber><ETag>etag-1</ETag></Part>',
          '<Part><PartNumber>2</PartNumber><ETag>etag-2</ETag></Part>',
          '</CompleteMultipartUpload>',
        ].join('')
      );
      return [200, { key: 'files/large.bin' }];
    });

    const result = await files.upload(data, { name: 'large.bin' });

    expect(result.id).toBe('file-2');
    expect(mock.history.put).toHaveLength(2);
    expect(mock.history.post).toHaveLength(1);
  });

  it('sorts parts by partNumber before completing multipart upload', async () => {
    const partSize = DEFAULT_CHUNK_SIZE;
    const data = new Uint8Array(partSize * 2 + 1);
    data.fill(3);

    vi.mocked(http.post).mockResolvedValue({
      data: [
        {
          id: 'file-3',
          key: 'files/shuffled.bin',
          multipart: true,
          multipartPartSize: partSize,
          platform: 'oss',
          cloudPlatform: 'ali',
          auth: {
            url: 'https://oss.example/complete-shuffled',
            headers: { 'Content-Type': 'application/xml' },
            Authorization: 'OSS complete-token',
          },
          multipartPartAuths: [
            {
              partNumber: 3,
              url: 'https://oss.example/part/3',
              Authorization: 'OSS part-3',
            },
            {
              partNumber: 1,
              url: 'https://oss.example/part/1',
              Authorization: 'OSS part-1',
            },
            {
              partNumber: 2,
              url: 'https://oss.example/part/2',
              Authorization: 'OSS part-2',
            },
          ],
        },
      ],
    } as never);

    mock.onPut(/https:\/\/oss\.example\/part\/\d+/).reply((config) => {
      const part = config.url?.match(/part\/(\d+)/)?.[1];
      return [200, '', { etag: `"etag-${part}"` }];
    });
    mock.onPost('https://oss.example/complete-shuffled').reply((config) => {
      expect(config.data).toBe(
        [
          '<CompleteMultipartUpload>',
          '<Part><PartNumber>1</PartNumber><ETag>etag-1</ETag></Part>',
          '<Part><PartNumber>2</PartNumber><ETag>etag-2</ETag></Part>',
          '<Part><PartNumber>3</PartNumber><ETag>etag-3</ETag></Part>',
          '</CompleteMultipartUpload>',
        ].join('')
      );
      return [200, { key: 'files/shuffled.bin' }];
    });

    await files.upload(data, { name: 'shuffled.bin' });

    expect(mock.history.put).toHaveLength(3);
    expect(mock.history.post).toHaveLength(1);
  });

  it('completes local multipart uploads with part hashes', async () => {
    const partSize = DEFAULT_CHUNK_SIZE;
    const data = new Uint8Array(partSize + 1);
    data.fill(9);

    vi.mocked(http.post).mockResolvedValue({
      data: [
        {
          id: 'file-local',
          key: 'files/local.bin',
          multipart: true,
          multipartPartSize: partSize,
          platform: 'local',
          auth: {
            url: 'https://slave.example/files/upload-id?signed=1',
            Authorization: 'Bearer complete-token',
          },
          multipartPartAuths: [
            { partNumber: 1, url: 'https://slave.example/files/upload-id/0?signed=1', Authorization: 'Bearer p1' },
            { partNumber: 2, url: 'https://slave.example/files/upload-id/1?signed=1', Authorization: 'Bearer p2' },
          ],
        },
      ],
    } as never);

    mock.onPut('https://slave.example/files/upload-id/0?signed=1').reply(200, { hash: 'hash-part-1' });
    mock.onPut('https://slave.example/files/upload-id/1?signed=1').reply(200, { hash: 'hash-part-2' });
    mock.onPost('https://slave.example/files/upload-id?signed=1').reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        parts: [
          { partNumber: 1, hash: 'hash-part-1' },
          { partNumber: 2, hash: 'hash-part-2' },
        ],
      });
      return [200, { id: 'file-local', key: 'files/local.bin' }];
    });

    const result = await files.upload(data, { name: 'local.bin' });
    expect(result.id).toBe('file-local');
  });

  it('skips OSS upload when server returns an existing file id', async () => {
    const data = new Uint8Array([9, 9, 9]);
    vi.mocked(http.post).mockResolvedValue({
      data: [{ id: 'file-existing', auth: null }],
    } as never);

    const result = await files.upload(data, { name: 'existing.bin' });

    expect(result.id).toBe('file-existing');
    expect(mock.history.put).toHaveLength(0);
    expect(mock.history.post).toHaveLength(0);
  });
});
