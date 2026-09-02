import type { HttpClient } from '../http-client.js';
import { parseListResult } from '../list-utils.js';
import type { CreateDocParams, ListResult, PaginationParams } from '../types.js';

export interface DocListParams extends PaginationParams {
  tag?: string;
  name?: string;
  roles?: string;
}

export class DocsApi {
  constructor(private readonly http: HttpClient) {}

  async list(spaceId?: string, params: DocListParams = {}): Promise<ListResult<unknown>> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.get(`/spaces/${encodeURIComponent(sid)}/docs`, {
      params: {
        spaceId: sid,
        _startIndex: params._startIndex ?? 0,
        _maxResults: params._maxResults ?? 20,
        ...(params.tag ? { tag: params.tag } : {}),
        ...(params.name ? { name: params.name } : {}),
        ...(params.roles ? { roles: params.roles } : {}),
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

  async create(params: CreateDocParams): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(params.spaceId);
    const res = await this.http.post(`/spaces/${encodeURIComponent(sid)}/docs`, {
      ...params,
      spaceId: sid,
      folderId: params.folderId ?? '',
      zone: params.zone ?? 0,
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
