# @caixuan-cc/sdk

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · **[日本語](README.ja.md)** · [한국어](README.ko.md)

[Caixuan](https://app.caixuan.cc) プラットフォーム向け TypeScript SDK。Node.js サービス、スクリプト、自動化ワークフローから Caixuan API を統合できます。

## インストール

```bash
npm install @caixuan-cc/sdk
```

Node.js >= 18 が必要です。

## クイックスタート

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// 現在のセッションを取得
const session = await client.session.get();

// スペースを一覧表示
const { rows: spaces } = await client.spaces.list();

// ファイルをアップロードしてドキュメントを作成
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## クライアントの初期化

`createCaixuan()` でクライアントインスタンスを作成します：

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // API ルート URL、デフォルト https://app.caixuan.cc/api
  token: 'your-auth-token',     // ユーザートークン（X-Auth-Token ヘッダー）
  spaceId: 'space-id',          // 現在のスペース ID（省略可；未指定時は自動解決）
  userId: 'user-id',            // ユーザー ID（省略可）
  lang: 'en',                   // 言語：'zh' | 'en'
  basicAuth: 'user:pass',       // nginx Basic Auth（省略可）
  onUnauthorized: async () => { // トークン期限切れ時に更新（省略可）
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

クライアント作成後に認証情報を更新することもできます：

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### トークンの取得

- Caixuan Web アプリで OAuth ログインを完了する
- または CLI を使用：`caixuan login` を実行後、`caixuan config show` で確認

### スペース ID の解決

ほとんどの API には `spaceId` が必要です。初期化時に指定されていない場合、SDK は次の順序で解決します：

1. 明示的に設定された `spaceId`
2. `/session` から取得した `defaultSpace.id`

## API モジュール

クライアントの名前空間から各リソース API にアクセスします：

| モジュール | 説明 |
|-----------|------|
| `client.session` | セッション（現在のユーザー、ログアウト） |
| `client.spaces` | スペース一覧、詳細、切り替え |
| `client.shares` | 共有リンク CRUD |
| `client.docs` | ドキュメント CRUD |
| `client.members` | スペースメンバー管理 |
| `client.files` | ファイルアップロード |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // 現在のスペース
const current = await client.spaces.current();     // セッションから取得
await client.spaces.select('space-id');            // 切り替えてデフォルトに設定
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: 'マイ共有',
  description: '任意の説明',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: '新しい名前', password: '1234' });
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
  name: 'Jane Doe',
});

await client.members.updateRole(undefined, 'user-id', 'manager');
await client.members.rename(undefined, 'user-id', '新しい名前');
await client.members.remove(undefined, 'user-id');
```

### Files（アップロード）

ローカルファイルパスまたはバイナリデータに対応し、単一ファイルおよびマルチパートアップロードを自動処理します：

```typescript
// ローカルファイルをアップロード
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// バイナリデータをアップロード（name 必須）
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

典型的なワークフロー：`files.upload()` で `fileId` を取得し、`docs.create()` でドキュメントを作成します。

## ページネーション

一覧エンドポイントは `ListResult<T>` を返します：

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

ページネーションパラメータ：

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## エラー処理

SDK は API エラーを `APIError` としてラップします：

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // HTTP ステータスコード
    console.error(err.code);          // ビジネスエラーコード
    console.error(err.requestId);     // リクエストトレース ID
    console.error(err.requestUrl);    // リクエスト URL
    console.error(err.requestPayload);// リクエストボディ
  }

  if (isRetriableError(err)) {
    // ネットワークエラーまたは 502/604 — リトライ可能
  }
}
```

SDK はネットワークタイムアウト、502、604 などのリトライ可能なエラーを指数バックオフで自動リトライします。

401 Unauthorized の場合、`onUnauthorized` が設定されていれば、SDK はトークンを更新してリクエストを再試行します。

## 型のエクスポート

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

## ライセンス

[MIT](../../LICENSE)
