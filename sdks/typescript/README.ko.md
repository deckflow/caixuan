# @caixuan-cc/sdk

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **[한국어](README.ko.md)**

[Caixuan](https://app.caixuan.cc) 플랫폼용 TypeScript SDK. Node.js 서비스, 스크립트 또는 자동화 워크플로에서 Caixuan API를 통합할 수 있습니다.

## 설치

```bash
npm install @caixuan-cc/sdk
```

Node.js >= 18 필요.

## 빠른 시작

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// 현재 세션 가져오기
const session = await client.session.get();

// 스페이스 목록 조회
const { rows: spaces } = await client.spaces.list();

// 파일 업로드 및 문서 생성
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## 클라이언트 초기화

`createCaixuan()`으로 클라이언트 인스턴스를 생성합니다:

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // API 루트 URL, 기본값 https://app.caixuan.cc/api
  token: 'your-auth-token',     // 사용자 토큰 (X-Auth-Token 헤더)
  spaceId: 'space-id',          // 현재 스페이스 ID (선택; 생략 시 자동 해석)
  userId: 'user-id',            // 사용자 ID (선택)
  lang: 'en',                   // 언어: 'zh' | 'en'
  basicAuth: 'user:pass',       // nginx Basic Auth (선택)
  onUnauthorized: async () => { // 토큰 만료 시 갱신 (선택)
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

클라이언트 생성 후에도 인증 정보를 업데이트할 수 있습니다:

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### 토큰 획득

- Caixuan 웹 앱에서 OAuth 로그인 완료
- 또는 CLI 사용: `caixuan login` 실행 후 `caixuan config show`로 확인

### 스페이스 ID 해석

대부분의 API는 `spaceId`가 필요합니다. 초기화 시 제공되지 않으면 SDK는 다음 순서로 해석합니다:

1. 명시적으로 설정된 `spaceId`
2. `/session`의 `defaultSpace.id`

## API 모듈

클라이언트의 네임스페이스를 통해 리소스 API에 접근합니다:

| 모듈 | 설명 |
|------|------|
| `client.session` | 세션 (현재 사용자, 로그아웃) |
| `client.spaces` | 스페이스 목록, 상세, 전환 |
| `client.shares` | 공유 링크 CRUD |
| `client.docs` | 문서 CRUD |
| `client.members` | 스페이스 멤버 관리 |
| `client.files` | 파일 업로드 |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // 현재 스페이스
const current = await client.spaces.current();     // 세션에서 조회
await client.spaces.select('space-id');            // 전환 후 기본값으로 설정
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: '내 공유',
  description: '선택적 설명',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: '새 이름', password: '1234' });
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
await client.members.rename(undefined, 'user-id', '새 이름');
await client.members.remove(undefined, 'user-id');
```

### Files (업로드)

로컬 파일 경로 또는 바이너리 데이터를 지원하며, 단일 파일 및 멀티파트 업로드를 자동 처리합니다:

```typescript
// 로컬 파일 업로드
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// 바이너리 데이터 업로드 (name 필수)
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

일반적인 워크플로: `files.upload()`로 `fileId`를 얻은 뒤 `docs.create()`로 문서를 생성합니다.

## 페이지네이션

목록 엔드포인트는 `ListResult<T>`를 반환합니다:

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

페이지네이션 매개변수:

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## 오류 처리

SDK는 API 오류를 `APIError`로 래핑합니다:

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // HTTP 상태 코드
    console.error(err.code);          // 비즈니스 오류 코드
    console.error(err.requestId);     // 요청 추적 ID
    console.error(err.requestUrl);    // 요청 URL
    console.error(err.requestPayload);// 요청 본문
  }

  if (isRetriableError(err)) {
    // 네트워크 오류 또는 502/604 — 재시도 가능
  }
}
```

SDK는 네트워크 타임아웃, 502, 604 등 재시도 가능한 오류를 지수 백오프로 자동 재시도합니다.

401 Unauthorized 시 `onUnauthorized`가 설정되어 있으면 SDK가 토큰을 갱신하고 요청을 재시도합니다.

## 타입 내보내기

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

## 라이선스

[MIT](../../LICENSE)
