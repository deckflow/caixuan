# @caixuan-cc/sdk

> [English](README.md) · **中文** · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[Caixuan](https://app.caixuan.cc) 平台的 TypeScript SDK，用于在 Node.js 服务、脚本或自动化流程中对接 Caixuan API。

## 安装

```bash
npm install @caixuan-cc/sdk
```

要求 Node.js >= 18。

## 快速开始

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// 获取当前会话
const session = await client.session.get();

// 列出空间
const { rows: spaces } = await client.spaces.list();

// 上传文件并创建文档
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## 初始化客户端

通过 `createCaixuan()` 创建客户端实例：

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // API 根地址，默认 https://app.caixuan.cc/api
  token: 'your-auth-token',     // 用户 Token（X-Auth-Token 请求头）
  spaceId: 'space-id',          // 当前操作的空间 ID（可选，未设置时会自动解析）
  userId: 'user-id',            // 用户 ID（可选）
  lang: 'zh',                   // 语言，'zh' | 'en'
  basicAuth: 'user:pass',       // nginx Basic Auth（可选）
  onUnauthorized: async () => { // Token 过期时自动刷新（可选）
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

客户端创建后，也可动态更新认证信息：

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### 获取 Token

- 在 Caixuan Web 端完成 OAuth 登录后获取
- 或使用 CLI：`caixuan login` 后通过 `caixuan config show` 查看

### 空间 ID 解析

多数 API 需要 `spaceId`。若初始化时未传入，SDK 会按以下顺序自动解析：

1. 已显式设置的 `spaceId`
2. 调用 `/session` 获取 `defaultSpace.id`

## API 模块

客户端通过命名空间访问各资源 API：

| 模块 | 说明 |
|------|------|
| `client.session` | 会话（当前用户、登出） |
| `client.spaces` | 空间列表、详情、切换 |
| `client.shares` | 分享链接 CRUD |
| `client.docs` | 文档 CRUD |
| `client.members` | 空间成员管理 |
| `client.files` | 文件上传 |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // 当前空间
const current = await client.spaces.current();     // 从 session 读取
await client.spaces.select('space-id');            // 切换并设为默认
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: '我的分享',
  description: '可选描述',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: '新名称', password: '1234' });
await client.shares.delete('share-id');
```

### Docs

```typescript
const { rows } = await client.docs.list(undefined, { name: 'demo', tag: 'pptx' });
const doc = await client.docs.get('doc-id');

const created = await client.docs.create({
  spaceId: 'space-id',
  fileId: 'file-id',
  name: 'demo.pptx',
  folderId: '',
});

await client.docs.rename('doc-id', 'new-name.pptx');
await client.docs.delete('doc-id');
await client.docs.recover('doc-id');
```

### Members

```typescript
const { rows } = await client.members.list();
const member = await client.members.get(undefined, 'user-id');

await client.members.add({
  spaceId: 'space-id',
  role: 'teammate',   // 'manager' | 'teammate' | 'guest'
  email: 'user@example.com',
  name: '张三',
});

await client.members.updateRole(undefined, 'user-id', 'manager');
await client.members.rename(undefined, 'user-id', '新名字');
await client.members.remove(undefined, 'user-id');
```

### Files（上传）

支持本地文件路径或二进制数据，自动处理单文件与分片上传：

```typescript
// 上传本地文件
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// 上传二进制数据（需指定 name）
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

典型工作流：先 `files.upload()` 获取 `fileId`，再 `docs.create()` 创建文档。

## 分页

列表接口返回 `ListResult<T>`：

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

分页参数：

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## 错误处理

SDK 将 API 错误封装为 `APIError`：

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // HTTP 状态码
    console.error(err.code);          // 业务错误码
    console.error(err.requestId);     // 请求追踪 ID
    console.error(err.requestUrl);    // 请求 URL
    console.error(err.requestPayload);// 请求体
  }

  if (isRetriableError(err)) {
    // 网络错误或 502/604，可重试
  }
}
```

SDK 内置对网络超时、502、604 等可重试错误的自动重试（指数退避）。

401 未授权时，若配置了 `onUnauthorized` 回调，SDK 会自动刷新 Token 并重试请求。

## 类型导出

```typescript
import type {
  CaixuanClient,
  CreateCaixuanOptions,
  MySpace,
  SessionInfo,
  ListResult,
  CreateShareParams,
  UpdateShareParams,
  CreateDocParams,
  AddMemberParams,
  FileUploadResult,
} from '@caixuan-cc/sdk';
```

## 许可证

[MIT](../../LICENSE)
