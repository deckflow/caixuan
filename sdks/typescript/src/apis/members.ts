import type { HttpClient } from '../http-client.js';
import { parseListResult } from '../list-utils.js';
import type { AddMemberParams, ListResult, PaginationParams } from '../types.js';

export class MembersApi {
  constructor(private readonly http: HttpClient) {}

  async list(spaceId?: string, params: PaginationParams = {}): Promise<ListResult<unknown>> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.get(`/teams/${encodeURIComponent(sid)}/users`, {
      params: {
        spaceId: sid,
        _startIndex: params._startIndex ?? 0,
        _maxResults: params._maxResults ?? 20,
      },
    });
    return parseListResult(res.data, res.headers);
  }

  async get(spaceId: string | undefined, userId: string): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.get(
      `/spaces/${encodeURIComponent(sid)}/users/${encodeURIComponent(userId)}`
    );
    return res.data;
  }

  async add(params: AddMemberParams): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(params.spaceId);
    const res = await this.http.post(`/teams/${encodeURIComponent(sid)}/users`, {
      ...params,
      spaceId: sid,
    });
    return res.data;
  }

  async updateRole(spaceId: string | undefined, userId: string, role: string): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.put(
      `/spaces/${encodeURIComponent(sid)}/users/${encodeURIComponent(userId)}/role`,
      { spaceId: sid, userId, role }
    );
    return res.data;
  }

  async rename(spaceId: string | undefined, userId: string, name: string): Promise<unknown> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.put(
      `/spaces/${encodeURIComponent(sid)}/users/${encodeURIComponent(userId)}/name`,
      { spaceId: sid, userId, name }
    );
    return res.data;
  }

  async remove(spaceId: string | undefined, userId: string): Promise<void> {
    const sid = await this.http.resolveSpaceId(spaceId);
    await this.http.delete(
      `/spaces/${encodeURIComponent(sid)}/users/${encodeURIComponent(userId)}`
    );
  }
}
