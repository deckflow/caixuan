import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ConfigSchema, type ConfigData } from '../types/config.js';

export class Config {
  private static readonly DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.caixuan');
  private static readonly CONFIG_FILE = 'config.json';

  private readonly configDir: string;
  private readonly configPath: string;
  private data: ConfigData;

  constructor(configDir?: string) {
    this.configDir =
      configDir || process.env.CAIXUAN_CONFIG_DIR || Config.DEFAULT_CONFIG_DIR;
    this.configPath = path.join(this.configDir, Config.CONFIG_FILE);
    this.data = ConfigSchema.parse({
      apiBase: process.env.CAIXUAN_API_BASE || undefined,
    });
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      this.data = ConfigSchema.parse(parsed);
    } catch {
      this.data = ConfigSchema.parse({
        apiBase: process.env.CAIXUAN_API_BASE || undefined,
      });
    }
  }

  async save(): Promise<void> {
    await fs.mkdir(this.configDir, { recursive: true });
    const validated = ConfigSchema.parse(this.data);
    await fs.writeFile(this.configPath, JSON.stringify(validated, null, 2), 'utf-8');
  }

  get<K extends keyof ConfigData>(key: K, defaultValue?: ConfigData[K]): ConfigData[K] | undefined {
    return this.data[key] ?? defaultValue;
  }

  async set<K extends keyof ConfigData>(key: K, value: ConfigData[K]): Promise<void> {
    this.data[key] = value;
    await this.save();
  }

  all(): ConfigData {
    return { ...this.data };
  }

  get token(): string | undefined {
    return this.data.token;
  }

  set token(value: string | undefined) {
    this.data.token = value;
  }

  get spaceId(): string | undefined {
    return this.data.spaceId;
  }

  set spaceId(value: string | undefined) {
    this.data.spaceId = value;
  }

  get userId(): string | undefined {
    return this.data.userId;
  }

  set userId(value: string | undefined) {
    this.data.userId = value;
  }

  get apiBase(): string {
    return this.data.apiBase || 'https://app.caixuan.cc/api';
  }

  set apiBase(value: string) {
    this.data.apiBase = value;
  }

  get basicAuth(): string | undefined {
    return process.env.CAIXUAN_BASIC_AUTH || this.data.basicAuth;
  }

  set basicAuth(value: string | undefined) {
    this.data.basicAuth = value;
  }

  async setToken(value: string): Promise<void> {
    this.data.token = value;
    await this.save();
  }

  async setSpaceId(value: string): Promise<void> {
    this.data.spaceId = value;
    await this.save();
  }

  async setUserId(value: string): Promise<void> {
    this.data.userId = value;
    await this.save();
  }

  async setApiBase(value: string): Promise<void> {
    this.data.apiBase = value;
    await this.save();
  }

  async setBasicAuth(value: string): Promise<void> {
    this.data.basicAuth = value;
    await this.save();
  }

  async clearBasicAuth(): Promise<void> {
    delete this.data.basicAuth;
    await this.save();
  }

  async clearToken(): Promise<void> {
    delete this.data.token;
    await this.save();
  }

  isConfigured(): boolean {
    return Boolean(this.data.token);
  }
}
