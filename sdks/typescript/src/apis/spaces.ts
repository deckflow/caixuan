import type { HttpClient } from '../http-client.js';
import { parseListResult } from '../list-utils.js';
import type { ListResult, MySpace } from '../types.js';

export class SpacesApi {
  constructor(private readonly http: HttpClient) {}

  async list(userId?: string): Promise<ListResult<MySpace>> {
    const uid = await this.http.resolveUserId(userId);
    const res = await this.http.get<unknown>(`/users/${encodeURIComponent(uid)}/spaces`);
    return parseListResult<MySpace>(res.data, res.headers);
  }

  async get(spaceId?: string): Promise<MySpace> {
    const sid = await this.http.resolveSpaceId(spaceId);
    const res = await this.http.get<MySpace>(`/spaces/${encodeURIComponent(sid)}`);
    return res.data;
  }

  async select(spaceId: string, onlyActive = false): Promise<unknown> {
    const res = await this.http.put(`/spaces/${encodeURIComponent(spaceId)}/selected`, {
      spaceId,
      onlyActive,
    });
    this.http.setSpaceId(spaceId);
    return res.data;
  }

  async current(): Promise<MySpace | undefined> {
    const session = await this.http.get<{ defaultSpace?: MySpace }>('/session');
    return session.data.defaultSpace;
  }
}
