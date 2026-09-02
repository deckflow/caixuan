import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import pLimit from 'p-limit';
import type { HttpClient } from './http-client.js';
import {
  DEFAULT_CHUNK_SIZE,
  type AuthInfo,
  type FileUploadResult,
  type PartAuth,
  type UploadAuthResponse,
  type UploadInput,
  type UploadOptions,
} from './types.js';

type NormalizedUpload = {
  name: string;
  bytes: number;
  hash: string;
  data: Uint8Array;
  chunkSize: number;
};

type MultipartPartResult = {
  partNumber: number;
  eTag?: string;
  hash?: string;
};

export class FilesApi {
  constructor(private readonly http: HttpClient) {}

  async upload(input: UploadInput, options: UploadOptions = {}): Promise<FileUploadResult> {
    const normalized = await this.normalizeInput(input, options);
    const spaceId = await this.http.resolveSpaceId(options.spaceId);

    const authList = await this.requestUploadAuths(spaceId, normalized);
    const authResponse = authList[0];
    if (!authResponse) {
      throw new Error('Upload authorization response is empty');
    }

    if (!authResponse.auth) {
      options.onProgress?.(1);
      return {
        id: authResponse.id,
        name: normalized.name,
        bytes: normalized.bytes,
        hash: normalized.hash,
      };
    }

    if (authResponse.multipart) {
      await this.uploadMultipart(normalized, authResponse, options.onProgress);
    } else {
      await this.uploadSingle(normalized, authResponse, options.onProgress);
    }

    return {
      id: authResponse.id,
      name: normalized.name,
      bytes: normalized.bytes,
      hash: normalized.hash,
    };
  }

  private async requestUploadAuths(spaceId: string, file: NormalizedUpload): Promise<UploadAuthResponse[]> {
    const res = await this.http.post<UploadAuthResponse[]>(
      `/spaces/${encodeURIComponent(spaceId)}/files/auths`,
      {
        spaceId,
        type: 'file',
        files: [
          {
            name: file.name,
            bytes: file.bytes,
            hash: file.hash,
            multipart: file.bytes > file.chunkSize,
          },
        ],
      }
    );
    return Array.isArray(res.data) ? res.data : [res.data];
  }

  private async normalizeInput(input: UploadInput, options: UploadOptions): Promise<NormalizedUpload> {
    const chunkSize = DEFAULT_CHUNK_SIZE;

    if (typeof input === 'string') {
      const data = new Uint8Array(await readFile(input));
      const hash = options.hash ?? this.md5(data);
      return {
        name: options.name ?? path.basename(input),
        bytes: data.byteLength,
        hash,
        data,
        chunkSize,
      };
    }

    const data = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    const name = options.name;
    if (!name) {
      throw new Error('name is required when uploading binary input');
    }
    return {
      name,
      bytes: data.byteLength,
      hash: options.hash ?? this.md5(data),
      data,
      chunkSize,
    };
  }

  private md5(data: Uint8Array): string {
    return createHash('md5').update(data).digest('hex');
  }

  private async uploadSingle(
    file: NormalizedUpload,
    authResponse: UploadAuthResponse,
    onProgress?: (percentage: number) => void
  ): Promise<void> {
    const { auth, platform } = authResponse;
    if (!auth) throw new Error('Missing auth in upload response');

    const headers = this.authHeaders(auth);
    if (platform === 'oss') {
      await axios.put(auth.url, file.data, { headers, maxBodyLength: Infinity, maxContentLength: Infinity });
    } else {
      await axios.put(auth.url, file.data, { headers, maxBodyLength: Infinity, maxContentLength: Infinity });
    }
    onProgress?.(1);
  }

  private async uploadMultipart(
    file: NormalizedUpload,
    authResponse: UploadAuthResponse,
    onProgress?: (percentage: number) => void
  ): Promise<void> {
    const { auth, multipartPartAuths, multipartPartSize, platform } = authResponse;
    if (!auth) throw new Error('Missing auth in upload response');
    if (!multipartPartAuths?.length) throw new Error('Multipart upload authorization missing');

    const chunkSize = multipartPartSize ?? file.chunkSize;
    const useOssParts = platform === 'oss' || (platform !== 'local' && authResponse.cloudPlatform !== 'baidu');
    const partTasks = multipartPartAuths.map((partAuth, index) => ({
      partAuth,
      partNumber: partAuth.partNumber ?? index + 1,
      progressIndex: index,
    }));
    const partCount = partTasks.length;
    const progress: number[] = new Array<number>(partCount).fill(0);
    const updateProgress = () => {
      onProgress?.((0.95 * progress.reduce((a, b) => a + b, 0)) / partCount);
    };

    const limit = pLimit(5);
    const parts = await Promise.all(
      partTasks.map(({ partAuth, partNumber, progressIndex }) =>
        limit(async () => {
          const start = (partNumber - 1) * chunkSize;
          const end = Math.min(start + chunkSize, file.data.byteLength);
          const chunk = file.data.slice(start, end);
          const headers = this.authHeaders(partAuth);

          let part: MultipartPartResult;
          if (useOssParts) {
            const res = await axios.put(partAuth.url, chunk, {
              headers,
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            });
            part = { partNumber, eTag: this.parseETag(res.headers.etag) };
          } else {
            const res = await axios.put<{ hash?: string }>(partAuth.url, this.createPartFormBody(file.name, chunk), {
              headers,
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            });
            part = { partNumber, hash: String(res.data?.hash ?? '') };
          }

          progress[progressIndex] = 1;
          updateProgress();
          return part;
        })
      )
    );

    parts.sort((a, b) => a.partNumber - b.partNumber);
    const completeBody = this.buildCompleteMultipartBody(authResponse, parts);
    await axios.post(auth.url, completeBody, {
      headers: this.authHeaders(auth),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    onProgress?.(1);
  }

  private createPartFormBody(name: string, chunk: Uint8Array): FormData {
    const form = new FormData();
    form.append('file', new Blob([chunk]), name);
    return form;
  }

  private parseETag(raw: string | undefined): string {
    if (!raw) return '';
    try {
      return JSON.parse(raw) as string;
    } catch {
      return raw;
    }
  }

  private buildCompleteMultipartBody(
    authResponse: UploadAuthResponse,
    parts: MultipartPartResult[]
  ): string | { parts: Array<{ partNumber: number; eTag?: string; hash?: string }> } {
    const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

    if (authResponse.platform === 'local') {
      return {
        parts: sortedParts.map((part) => ({
          partNumber: part.partNumber,
          hash: part.hash ?? '',
        })),
      };
    }

    if (authResponse.cloudPlatform === 'baidu') {
      return {
        parts: sortedParts.map((part) => ({
          partNumber: part.partNumber,
          eTag: part.eTag ?? '',
        })),
      };
    }

    return [
      '<CompleteMultipartUpload>',
      ...sortedParts.map(
        (part) => `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${part.eTag ?? ''}</ETag></Part>`
      ),
      '</CompleteMultipartUpload>',
    ].join('');
  }

  private authHeaders(auth: AuthInfo | PartAuth): Record<string, string> {
    const headers: Record<string, string> = { ...(auth.headers ?? {}) };
    if (auth.Authorization) {
      headers.Authorization = auth.Authorization;
    }
    return headers;
  }
}
