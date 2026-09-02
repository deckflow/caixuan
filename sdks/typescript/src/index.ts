import { DocsApi } from './apis/docs.js';
import { MembersApi } from './apis/members.js';
import { SessionApi } from './apis/session.js';
import { SharesApi } from './apis/shares.js';
import { SpacesApi } from './apis/spaces.js';
import { FilesApi } from './files.js';
import { HttpClient } from './http-client.js';
import type { CreateCaixuanOptions } from './types.js';

export { APIError, isRetriableError } from './errors.js';
export { DEFAULT_ROOT } from './types.js';
export type {
  AddMemberParams,
  CreateCaixuanOptions,
  CreateDocParams,
  CreateShareParams,
  FileUploadResult,
  ListResult,
  MySpace,
  SessionInfo,
  UpdateShareParams,
} from './types.js';

export interface CaixuanClient {
  readonly root: string;
  session: SessionApi;
  spaces: SpacesApi;
  shares: SharesApi;
  docs: DocsApi;
  members: MembersApi;
  files: FilesApi;
  setToken(token: string | undefined): void;
  setSpaceId(spaceId: string | undefined): void;
  setUserId(userId: string | undefined): void;
}

export function createCaixuan(options: CreateCaixuanOptions = {}): CaixuanClient {
  const http = new HttpClient(options);

  return {
    root: http.root,
    session: new SessionApi(http),
    spaces: new SpacesApi(http),
    shares: new SharesApi(http),
    docs: new DocsApi(http),
    members: new MembersApi(http),
    files: new FilesApi(http),
    setToken: (token) => http.setToken(token),
    setSpaceId: (spaceId) => http.setSpaceId(spaceId),
    setUserId: (userId) => http.setUserId(userId),
  };
}
