import type { HttpClient } from '../http-client.js';
import { parseListResult } from '../list-utils.js';
import type { CreateDocParams, ListResult, PaginationParams } from '../types.js';

export interface DocListParams extends PaginationParams {
  name?: string;
  folderId?: string;
  zone?: number;
  /** When true, list via `space.docs`; otherwise `space.ownDocs`. */
  my?: boolean;
  /** Comma-separated includes, e.g. `creator,portfolio` */
  includes?: string[];
}

export class DocsApi {
  constructor(private readonly http: HttpClient) {}

  /**
   * List documents in a space.
   * - default: `space.ownDocs` (`/spaces/:id/owner/docs`)
   * - `my: true`: `space.docs` (`/spaces/:id/docs`)
   */
  async list(spaceId?: string, params: DocListParams = {}): Promise<ListResult<unknown>> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const path = params.my
      ? `/spaces/${encodeURIComponent(sid)}/docs`
      : `/spaces/${encodeURIComponent(sid)}/owner/docs`;
    const res = await this.http.get(path, {
      params: {
        spaceId: sid,
        _startIndex: params._startIndex ?? 0,
        _maxResults: params._maxResults ?? 20,
        ...(params.name ? { name: params.name } : {}),
        ...(params.folderId !== undefined ? { folderId: params.folderId } : {}),
        ...(params.zone !== undefined ? { zone: params.zone } : {}),
        ...(params.includes?.length ? { _includes: params.includes } : {}),
      },
    });
    return parseListResult(res.data, res.headers);
  }

  async get(docId: string, includes?: string[]): Promise<unknown> {
    const res = await this.http.get(`/docs/${encodeURIComponent(docId)}`, {
      params: includes?.length ? { _includes: includes } : undefined,
    });
    return res.data;
  }

  /**
   * Get a document release.
   * `releaseId` supports mixed ids including `FIRST` / `LATEST`.
   */
  async release(
    docId: string,
    releaseId: string = 'LATEST',
    includes?: ('creator' | 'record')[]
  ): Promise<{ path?: string; [key: string]: unknown }> {
    const res = await this.http.get<{ path?: string; [key: string]: unknown }>(
      `/docs/${encodeURIComponent(docId)}/releases/${encodeURIComponent(releaseId)}`,
      {
        params: includes?.length ? { _includes: includes } : undefined,
      }
    );
    return res.data;
  }

  async create(params: CreateDocParams): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(params.spaceId);
    const res = await this.http.post(`/spaces/${encodeURIComponent(sid)}/docs`, {
      ...params,
      spaceId: sid,
      folderId: params.folderId ?? '',
      zone: params.zone ?? -1,
    });
    return res.data;
  }

  async rename(docId: string, name: string): Promise<unknown> {
    const res = await this.http.put(`/docs/${encodeURIComponent(docId)}/name`, { id: docId, name });
    return res.data;
  }

  async delete(docId: string): Promise<void> {
    await this.http.delete(`/docs/${encodeURIComponent(docId)}`);
  }

  async recover(docId: string): Promise<unknown> {
    const res = await this.http.put(`/docs/${encodeURIComponent(docId)}/recover`, { id: docId });
    return res.data;
  }
}
