import axios, { AxiosHeaders, type AxiosInstance } from 'axios';
import { APIError, getRetryDelaysMs, isRetriableAxiosError } from './errors.js';
import { DEFAULT_ROOT, type CreateCaixuanOptions } from './types.js';

type RetriableConfig = Record<string, unknown> & {
  headers?: Record<string, string>;
  __caixuanAuthRetried?: boolean;
};

type AuthRefreshResult = { token: string; spaceId?: string; userId?: string } | string;

export class HttpClient {
  private client: AxiosInstance;
  public readonly root: string;
  public token?: string;
  public spaceId?: string;
  public userId?: string;
  public lang: 'zh' | 'en';
  public basicAuth?: string;
  private spaceIdExplicit = false;
  private resolvedSpaceIdPromise?: Promise<string>;
  private authRefreshPromise?: Promise<AuthRefreshResult>;
  private readonly onUnauthorized?: CreateCaixuanOptions['onUnauthorized'];

  constructor(options: CreateCaixuanOptions = {}) {
    this.root = (options.root ?? DEFAULT_ROOT).replace(/\/$/, '');
    this.token = options.token;
    this.spaceId = options.spaceId;
    this.userId = options.userId;
    this.lang = options.lang ?? 'zh';
    this.basicAuth = options.basicAuth;
    this.spaceIdExplicit = Boolean(options.spaceId);
    this.onUnauthorized = options.onUnauthorized;

    this.client = axios.create({
      baseURL: this.root,
      headers: this.buildAuthHeaders(),
      timeout: 120_000,
    });

    this.client.interceptors.request.use((config) => {
      const authHeaders = this.buildAuthHeaders();
      const headers = config.headers;

      if (headers && typeof (headers as { set?: unknown }).set === 'function') {
        const mutable = headers as { set: (key: string, value: string) => void };
        for (const [key, value] of Object.entries(authHeaders)) {
          mutable.set(key, value);
        }
        return config;
      }

      config.headers = AxiosHeaders.from({
        ...(headers as Record<string, string> | undefined),
        ...authHeaders,
      });
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (!axios.isAxiosError(error)) throw error;

        const status = error.response?.status;
        const cfg = error.config as RetriableConfig | undefined;

        if (status === 401 && cfg && !cfg.__caixuanAuthRetried && this.onUnauthorized) {
          cfg.__caixuanAuthRetried = true;
          const oldSpaceId = this.spaceId;
          const auth = await this.refreshAuth();
          this.applyAuthResult(auth, cfg, oldSpaceId);
          return await this.client.request(cfg);
        }

        if (status === 401) {
          throw APIError.unauthorized(error);
        }

        throw error;
      }
    );
  }

  setToken(token: string | undefined): void {
    this.token = token;
    if (!this.spaceIdExplicit) {
      this.spaceId = undefined;
      this.resolvedSpaceIdPromise = undefined;
    }
    this.applyAuthHeaders();
  }

  setSpaceId(spaceId: string | undefined): void {
    this.spaceId = spaceId;
    this.spaceIdExplicit = Boolean(spaceId);
    this.resolvedSpaceIdPromise = undefined;
  }

  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  setBasicAuth(basicAuth: string | undefined): void {
    this.basicAuth = basicAuth;
    this.applyAuthHeaders();
  }

  async resolveSpaceId(spaceId?: string): Promise<string> {
    if (spaceId) return spaceId;
    if (this.spaceId) return this.spaceId;

    if (!this.resolvedSpaceIdPromise) {
      this.resolvedSpaceIdPromise = this.fetchDefaultSpaceId();
    }

    try {
      return await this.resolvedSpaceIdPromise;
    } catch (error) {
      this.resolvedSpaceIdPromise = undefined;
      throw error;
    }
  }

  private async fetchDefaultSpaceId(): Promise<string> {
    const res = await this.get<{ defaultSpace?: { id: string } }>('/session');
    const id = res.data.defaultSpace?.id;
    if (!id) {
      throw new Error('No default space found. Run `caixuan space select <space-id>`.');
    }
    this.spaceId = id;
    return id;
  }

  async resolveUserId(userId?: string): Promise<string> {
    if (userId) return userId;
    if (this.userId) return this.userId;

    const res = await this.get<{ id: string }>('/session');
    const id = res.data.id;
    if (!id) {
      throw new Error('No user id in session. Please log in.');
    }
    this.userId = id;
    return id;
  }

  url(path: string): string {
    return `${this.root}/${path.replace(/^\//, '')}`;
  }

  async get<T>(
    path: string,
    config?: { params?: Record<string, unknown> }
  ): Promise<{ data: T; headers: Record<string, unknown> }> {
    try {
      const res = await this.withRetry(() => this.client.get<T>(this.url(path), config));
      return { data: res.data, headers: res.headers as Record<string, unknown> };
    } catch (error) {
      if (axios.isAxiosError(error)) throw APIError.fromAxiosError(error);
      throw error;
    }
  }

  async post<T>(path: string, data?: unknown): Promise<{ data: T; headers: Record<string, unknown> }> {
    try {
      const res = await this.withRetry(() => this.client.post<T>(this.url(path), data));
      return { data: res.data, headers: res.headers as Record<string, unknown> };
    } catch (error) {
      if (axios.isAxiosError(error)) throw APIError.fromAxiosError(error);
      throw error;
    }
  }

  async put<T>(path: string, data?: unknown): Promise<{ data: T; headers: Record<string, unknown> }> {
    try {
      const res = await this.withRetry(() => this.client.put<T>(this.url(path), data));
      return { data: res.data, headers: res.headers as Record<string, unknown> };
    } catch (error) {
      if (axios.isAxiosError(error)) throw APIError.fromAxiosError(error);
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await this.withRetry(() => this.client.delete(this.url(path)));
    } catch (error) {
      if (axios.isAxiosError(error)) throw APIError.fromAxiosError(error);
      throw error;
    }
  }

  private async withRetry<T>(request: () => Promise<T>): Promise<T> {
    const delays = getRetryDelaysMs();
    let lastError: unknown;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      if (attempt > 0) {
        await this.sleep(delays[attempt - 1] ?? delays[delays.length - 1]!);
      }
      try {
        return await request();
      } catch (error) {
        lastError = error;
        if (!axios.isAxiosError(error) || !isRetriableAxiosError(error) || attempt >= delays.length) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-language': this.lang,
      'x-device-type': 'cli',
    };
    if (this.basicAuth) {
      headers.Authorization = `Basic ${Buffer.from(this.basicAuth, 'utf8').toString('base64')}`;
    }
    if (this.token) {
      headers['X-Auth-Token'] = this.token;
    }
    return headers;
  }

  private applyAuthHeaders(): void {
    const headers = this.buildAuthHeaders();
    delete this.client.defaults.headers.common.Authorization;
    delete this.client.defaults.headers.common['X-Auth-Token'];
    for (const [key, value] of Object.entries(headers)) {
      this.client.defaults.headers.common[key] = value;
    }
  }

  private refreshAuth(): Promise<AuthRefreshResult> {
    if (!this.onUnauthorized) {
      return Promise.reject(new Error('onUnauthorized is not configured'));
    }
    if (!this.authRefreshPromise) {
      this.authRefreshPromise = this.onUnauthorized().finally(() => {
        this.authRefreshPromise = undefined;
      });
    }
    return this.authRefreshPromise;
  }

  private applyAuthResult(
    auth: AuthRefreshResult,
    cfg?: RetriableConfig,
    oldSpaceId?: string
  ): string | undefined {
    const nextToken = typeof auth === 'string' ? auth : auth.token;
    const nextSpaceId = typeof auth === 'string' ? this.spaceId : auth.spaceId;
    const nextUserId = typeof auth === 'string' ? this.userId : auth.userId;

    this.setToken(nextToken);
    if (nextSpaceId) this.setSpaceId(nextSpaceId);
    if (nextUserId) this.userId = nextUserId;

    if (cfg) {
      this.rewriteRequestSpaceId(cfg, oldSpaceId, nextSpaceId);
      cfg.headers = { ...(cfg.headers ?? {}), ...this.buildAuthHeaders() };
    }

    return nextSpaceId;
  }

  private rewriteRequestSpaceId(cfg: RetriableConfig, oldSpaceId?: string, newSpaceId?: string): void {
    if (!oldSpaceId || !newSpaceId || oldSpaceId === newSpaceId) return;

    const encodedOld = encodeURIComponent(oldSpaceId);
    const encodedNew = encodeURIComponent(newSpaceId);

    if (typeof cfg.url === 'string') {
      cfg.url = cfg.url
        .replace(`/spaces/${encodedOld}/`, `/spaces/${encodedNew}/`)
        .replace(`/teams/${encodedOld}/`, `/teams/${encodedNew}/`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
