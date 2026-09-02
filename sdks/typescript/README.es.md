# @caixuan-cc/sdk

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · **[Español](README.es.md)** · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

SDK de TypeScript para la plataforma [Caixuan](https://app.caixuan.cc). Integra la API de Caixuan desde servicios Node.js, scripts o flujos de automatización.

## Instalación

```bash
npm install @caixuan-cc/sdk
```

Requiere Node.js >= 18.

## Inicio rápido

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// Obtener la sesión actual
const session = await client.session.get();

// Listar espacios
const { rows: spaces } = await client.spaces.list();

// Subir un archivo y crear un documento
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## Inicializar el cliente

Crea una instancia del cliente con `createCaixuan()`:

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // URL raíz de la API, predeterminada https://app.caixuan.cc/api
  token: 'your-auth-token',     // Token de usuario (cabecera X-Auth-Token)
  spaceId: 'space-id',          // ID del espacio actual (opcional; se resuelve automáticamente si se omite)
  userId: 'user-id',            // ID de usuario (opcional)
  lang: 'en',                   // Idioma: 'zh' | 'en'
  basicAuth: 'user:pass',       // Basic Auth de nginx (opcional)
  onUnauthorized: async () => { // Actualizar token al expirar (opcional)
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

También puedes actualizar las credenciales después de crear el cliente:

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### Obtener un token

- Completa el inicio de sesión OAuth en la aplicación web de Caixuan
- O usa la CLI: ejecuta `caixuan login`, luego `caixuan config show`

### Resolución del ID de espacio

La mayoría de las API requieren un `spaceId`. Si no se proporciona en la inicialización, el SDK lo resuelve en este orden:

1. `spaceId` establecido explícitamente
2. `defaultSpace.id` desde `/session`

## Módulos de la API

Accede a las API de recursos a través de espacios de nombres en el cliente:

| Módulo | Descripción |
|--------|-------------|
| `client.session` | Sesión (usuario actual, cierre de sesión) |
| `client.spaces` | Lista, detalles y cambio de espacio |
| `client.shares` | CRUD de enlaces de compartición |
| `client.docs` | CRUD de documentos |
| `client.members` | Gestión de miembros del espacio |
| `client.files` | Subida de archivos |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // Espacio actual
const current = await client.spaces.current();     // Desde la sesión
await client.spaces.select('space-id');            // Cambiar y establecer como predeterminado
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: 'Mi compartición',
  description: 'Descripción opcional',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: 'Nuevo nombre', password: '1234' });
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
await client.members.rename(undefined, 'user-id', 'Nuevo nombre');
await client.members.remove(undefined, 'user-id');
```

### Files (subida)

Admite rutas de archivos locales o datos binarios, con subida automática de archivo único o multipart:

```typescript
// Subir un archivo local
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// Subir datos binarios (name obligatorio)
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

Flujo de trabajo típico: llama a `files.upload()` para obtener `fileId`, luego `docs.create()` para crear el documento.

## Paginación

Los endpoints de listado devuelven `ListResult<T>`:

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

Parámetros de paginación:

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## Manejo de errores

El SDK encapsula los errores de la API como `APIError`:

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // Código de estado HTTP
    console.error(err.code);          // Código de error de negocio
    console.error(err.requestId);     // ID de trazabilidad de la solicitud
    console.error(err.requestUrl);    // URL de la solicitud
    console.error(err.requestPayload);// Cuerpo de la solicitud
  }

  if (isRetriableError(err)) {
    // Errores de red o 502/604 — seguro reintentar
  }
}
```

El SDK reintenta automáticamente los errores recuperables (timeouts de red, 502, 604) con backoff exponencial.

En 401 Unauthorized, si `onUnauthorized` está configurado, el SDK actualiza el token y reintenta la solicitud.

## Exportación de tipos

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

## Licencia

[MIT](../../LICENSE)
