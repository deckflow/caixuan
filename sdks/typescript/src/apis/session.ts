import type { HttpClient } from '../http-client.js';
import type { SessionInfo } from '../types.js';

export class SessionApi {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<SessionInfo> {
    const res = await this.http.get<SessionInfo>('/session');
    if (res.data.id) {
      this.http.setUserId(res.data.id);
    }
    if (res.data.defaultSpace?.id) {
      this.http.setSpaceId(res.data.defaultSpace.id);
    }
    return res.data;
  }

  async logout(): Promise<void> {
    await this.http.delete('/session');
    this.http.setToken(undefined);
  }
}
