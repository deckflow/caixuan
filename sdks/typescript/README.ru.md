# @caixuan-cc/sdk

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · **[Русский](README.ru.md)** · [日本語](README.ja.md) · [한국어](README.ko.md)

TypeScript SDK для платформы [Caixuan](https://app.caixuan.cc). Интегрируйте API Caixuan из сервисов Node.js, скриптов или автоматизированных рабочих процессов.

## Установка

```bash
npm install @caixuan-cc/sdk
```

Требуется Node.js >= 18.

## Быстрый старт

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// Получить текущую сессию
const session = await client.session.get();

// Список пространств
const { rows: spaces } = await client.spaces.list();

// Загрузить файл и создать документ
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## Инициализация клиента

Создайте экземпляр клиента с помощью `createCaixuan()`:

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // Корневой URL API, по умолчанию https://app.caixuan.cc/api
  token: 'your-auth-token',     // Токен пользователя (заголовок X-Auth-Token)
  spaceId: 'space-id',          // ID текущего пространства (необязательно; определяется автоматически, если не указан)
  userId: 'user-id',            // ID пользователя (необязательно)
  lang: 'en',                   // Язык: 'zh' | 'en'
  basicAuth: 'user:pass',       // nginx Basic Auth (необязательно)
  onUnauthorized: async () => { // Обновление токена при истечении (необязательно)
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

Также можно обновить учётные данные после создания клиента:

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### Получение токена

- Пройдите OAuth-авторизацию в веб-приложении Caixuan
- Или используйте CLI: выполните `caixuan login`, затем `caixuan config show`

### Определение ID пространства

Большинству API требуется `spaceId`. Если он не указан при инициализации, SDK определяет его в следующем порядке:

1. Явно заданный `spaceId`
2. `defaultSpace.id` из `/session`

## Модули API

Доступ к API ресурсов через пространства имён клиента:

| Модуль | Описание |
|--------|----------|
| `client.session` | Сессия (текущий пользователь, выход) |
| `client.spaces` | Список пространств, детали, переключение |
| `client.shares` | CRUD ссылок для общего доступа |
| `client.docs` | CRUD документов |
| `client.members` | Управление участниками пространства |
| `client.files` | Загрузка файлов |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // Текущее пространство
const current = await client.spaces.current();     // Из сессии
await client.spaces.select('space-id');            // Переключить и установить по умолчанию
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: 'Моя ссылка',
  description: 'Необязательное описание',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: 'Новое имя', password: '1234' });
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
await client.members.rename(undefined, 'user-id', 'Новое имя');
await client.members.remove(undefined, 'user-id');
```

### Files (загрузка)

Поддерживает локальные пути к файлам или бинарные данные с автоматической одиночной и multipart-загрузкой:

```typescript
// Загрузить локальный файл
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// Загрузить бинарные данные (name обязателен)
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

Типичный рабочий процесс: вызовите `files.upload()` для получения `fileId`, затем `docs.create()` для создания документа.

## Пагинация

Конечные точки списков возвращают `ListResult<T>`:

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

Параметры пагинации:

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## Обработка ошибок

SDK оборачивает ошибки API в `APIError`:

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // HTTP-код статуса
    console.error(err.code);          // Код бизнес-ошибки
    console.error(err.requestId);     // ID трассировки запроса
    console.error(err.requestUrl);    // URL запроса
    console.error(err.requestPayload);// Тело запроса
  }

  if (isRetriableError(err)) {
    // Сетевые ошибки или 502/604 — можно повторить
  }
}
```

SDK автоматически повторяет повторяемые ошибки (сетевые таймауты, 502, 604) с экспоненциальной задержкой.

При 401 Unauthorized, если настроен `onUnauthorized`, SDK обновляет токен и повторяет запрос.

## Экспорт типов

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

## Лицензия

[MIT](../../LICENSE)
