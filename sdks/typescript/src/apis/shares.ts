import type { HttpClient } from '../http-client.js';
import { parseListResult } from '../list-utils.js';
import type { CreateShareParams, ListResult, PaginationParams, UpdateShareParams } from '../types.js';

export class SharesApi {
  constructor(private readonly http: HttpClient) {}

  async list(spaceId?: string, params: PaginationParams = {}): Promise<ListResult<unknown>> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.get(`/spaces/${encodeURIComponent(sid)}/shares`, {
      params: {
        spaceId: sid,
        _startIndex: params._startIndex ?? 0,
        _maxResults: params._maxResults ?? 20,
      },
    });
    return parseListResult(res.data, res.headers);
  }

  async get(shareId: string, includes?: string[]): Promise<unknown> {
    const res = await this.http.get(`/shares/${encodeURIComponent(shareId)}`, {
      params: includes?.length ? { _includes: includes } : undefined,
    });
    return res.data;
  }

  async create(params: CreateShareParams): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(params.spaceId);
    const res = await this.http.post(`/spaces/${encodeURIComponent(sid)}/shares`, {
      ...params,
      spaceId: sid,
    });
    return res.data;
  }

  async update(params: UpdateShareParams): Promise<unknown> {
    const { id, ...body } = params;
    const res = await this.http.put(`/shares/${encodeURIComponent(id)}`, body);
    return res.data;
  }

  async delete(shareId: string): Promise<void> {
    await this.http.delete(`/shares/${encodeURIComponent(shareId)}`);
  }
}
