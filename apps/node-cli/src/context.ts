import ora from 'ora';
import { APIError, createCaixuan, type CaixuanClient } from '@caixuan-cc/sdk';
import { Config } from './core/config.js';
import { runLoginFlow } from './core/auth.js';
import { ExitCode, outputError, outputRequestDebug } from './utils/errors.js';

type SpinnerLike = {
  text: string;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
};

export class Context {
  public config: Config;
  public jsonOutput: boolean;
  public debugOutput: boolean;
  private _client?: CaixuanClient;
  private _loginPromise?: Promise<string>;

  constructor() {
    this.config = new Config();
    this.jsonOutput = false;
    this.debugOutput = false;
  }

  async init(): Promise<void> {
    await this.config.load();
  }

  async getClient(): Promise<CaixuanClient> {
    if (!this._client) {
      this._client = createCaixuan({
        root: this.config.apiBase,
        token: this.config.token,
        spaceId: this.config.spaceId,
        userId: this.config.userId,
        basicAuth: this.config.basicAuth,
        onUnauthorized: async () => {
          const reason = this.config.token ? 'unauthorized' : 'explicit';
          const token = await this.ensureLoggedIn(3737, reason);
          return { token, spaceId: this.config.spaceId, userId: this.config.userId };
        },
        onRequestDebug: (info) => {
          if (this.debugOutput) {
            outputRequestDebug(info, this.jsonOutput);
          }
        },
      });
    } else {
      this._client.setToken(this.config.token);
      if (this.config.spaceId) this._client.setSpaceId(this.config.spaceId);
      if (this.config.userId) this._client.setUserId(this.config.userId);
      this._client.setBasicAuth(this.config.basicAuth);
    }

    return this._client;
  }

  async ensureLoggedIn(port = 3737, reason: 'explicit' | 'unauthorized' = 'explicit'): Promise<string> {
    if (this._loginPromise) {
      return this._loginPromise;
    }

    this._loginPromise = (async () => {
      const { token, spaceId } = await runLoginFlow({
        apiBase: this.config.apiBase,
        port,
        jsonOutput: this.jsonOutput,
        basicAuth: this.config.basicAuth,
        reason,
      });

      await this.config.setToken(token);
      if (spaceId) {
        await this.config.setSpaceId(spaceId);
      }

      const client = await this.getClient();
      client.setToken(token);
      if (spaceId) client.setSpaceId(spaceId);

      try {
        const session = await client.session.get();
        if (session.id) {
          await this.config.setUserId(session.id);
          client.setUserId(session.id);
        }
      } catch {
        // session fetch is best-effort after login
      }

      return token;
    })();

    try {
      return await this._loginPromise;
    } finally {
      this._loginPromise = undefined;
    }
  }

  output(data: unknown, humanFormat?: (data: unknown) => string, meta?: Record<string, unknown>): void {
    if (this.jsonOutput) {
      console.log(JSON.stringify({ ok: true, data, ...(meta ? { meta } : {}) }, null, 2));
    } else if (humanFormat) {
      console.log(humanFormat(data));
    } else {
      console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
  }

  error(error: unknown, code?: string): never {
    const exitCode = this.resolveExitCode(error, code);
    if (this.jsonOutput) {
      const payload: Record<string, unknown> = { ok: false, error: this.formatJsonError(error, code) };
      console.error(JSON.stringify(payload, null, 2));
    } else {
      outputError(error instanceof Error ? error : new Error(String(error)), false, this.debugOutput);
    }
    process.exit(exitCode);
  }

  private formatJsonError(error: unknown, code?: string): Record<string, unknown> {
    if (error instanceof APIError) {
      const payload: Record<string, unknown> = {
        code: code ?? error.code ?? error.name,
        message: error.message,
        requestId: error.requestId,
        statusCode: error.statusCode,
        body: error.responseData,
      };
      if (this.debugOutput) {
        if (error.requestMethod) payload.verb = error.requestMethod;
        if (error.requestUrl) payload.url = error.requestUrl;
        if (error.requestPayload !== undefined) payload.payload = error.requestPayload;
      }
      return payload;
    }
    if (error instanceof Error) {
      return { code: code ?? error.name, message: error.message };
    }
    return { code: code ?? 'ERROR', message: String(error) };
  }

  private resolveExitCode(error: unknown, code?: string): number {
    if (code === 'INVALID_ARGS' || code === 'USAGE_ERROR') return ExitCode.USAGE_ERROR;
    if (error instanceof APIError && error.statusCode === 401) return ExitCode.UNAUTHORIZED;
    return ExitCode.ERROR;
  }

  createSpinner(text: string): SpinnerLike {
    if (this.jsonOutput) {
      return {
        text,
        succeed: () => undefined,
        fail: () => undefined,
      };
    }
    return ora(text);
  }

  succeedSpinner(spinner: SpinnerLike | undefined, text: string): void {
    spinner?.succeed(text);
  }

  failSpinner(spinner: SpinnerLike | undefined, text: string): void {
    spinner?.fail(text);
  }

  requireAuth(): void {
    if (!this.config.token) {
      this.error('Not logged in. Run `caixuan login` or `caixuan config set-token <token>`.', 'UNAUTHORIZED');
    }
  }

  resetClient(): void {
    this._client = undefined;
  }
}
