export const DEFAULT_ROOT = 'https://app.caixuan.cc/api';
export const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024;

export type Lang = 'zh' | 'en';

export type MetadataValue =
  | string
  | number
  | boolean
  | null
  | MetadataValue[]
  | { [key: string]: MetadataValue };

export interface ListResult<T> {
  rows: T[];
  count: number;
}

export interface PaginationParams {
  _startIndex?: number;
  _maxResults?: number;
}

export interface CreateCaixuanOptions {
  root?: string;
  token?: string;
  spaceId?: string;
  userId?: string;
  lang?: Lang;
  /** nginx HTTP Basic Auth credentials in `username:password` form */
  basicAuth?: string;
  onUnauthorized?: () => Promise<{ token: string; spaceId?: string; userId?: string } | string>;
}

export interface MySpace {
  id: string;
  name: string;
  type: string;
  subType: string;
  selected?: boolean;
  role: string;
  avatar?: string;
  docNum?: number;
  memberName?: string;
  memberStatus?: string;
}

export interface SessionInfo {
  id: string;
  _type: string;
  defaultSpace?: MySpace;
  auth?: { spaceId?: string };
}

export interface ShareContentDocItem {
  _type: 'doc';
  id: string;
  trial?: { type: 'percent' | 'count'; value: number };
}

export interface ShareContentDividerItem {
  _type: 'divider';
  name: string;
}

export type ShareContentItem = ShareContentDocItem | ShareContentDividerItem;

export interface CreateShareParams {
  spaceId: string;
  name: string;
  description?: string;
  content?: ShareContentItem[];
  needPhone?: 'yes' | 'no';
  viewControl?: string;
  password?: string;
  [key: string]: unknown;
}

export interface UpdateShareParams {
  id: string;
  name?: string;
  description?: string;
  content?: ShareContentItem[];
  needPhone?: 'yes' | 'no';
  viewControl?: string;
  password?: string;
  [key: string]: unknown;
}

export interface CreateDocParams {
  spaceId: string;
  fileId?: string;
  name?: string;
  folderId?: string;
  zone?: number;
  isFolder?: boolean;
  isPublic?: boolean;
}

export interface AddMemberParams {
  spaceId: string;
  role: 'manager' | 'teammate' | 'guest';
  userId?: string;
  mobile?: string;
  email?: string;
  name?: string;
}

export interface AuthInfo {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  Authorization?: string;
  [key: string]: unknown;
}

export interface PartAuth {
  partNumber: number;
  url: string;
  headers?: Record<string, string>;
  Authorization?: string;
}

export interface UploadAuthResponse {
  id: string;
  key?: string;
  auth?: AuthInfo | null;
  multipart?: boolean;
  multipartPartAuths?: PartAuth[];
  multipartPartSize?: number;
  multipartUploadId?: string;
  platform?: 'oss' | 'local' | 's3' | string;
  cloudPlatform?: 'baidu' | 'ali';
}

export type UploadInput = string | Uint8Array | ArrayBuffer;

export interface UploadOptions {
  spaceId?: string;
  name?: string;
  hash?: string;
  onProgress?: (percentage: number) => void;
}

export interface FileUploadResult {
  id: string;
  name: string;
  bytes: number;
  hash: string;
}
