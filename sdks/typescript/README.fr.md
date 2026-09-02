# @caixuan-cc/sdk

> [English](README.md) · [中文](README.zh-CN.md) · **[Français](README.fr.md)** · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

SDK TypeScript pour la plateforme [Caixuan](https://app.caixuan.cc). Intégrez l’API Caixuan depuis des services Node.js, des scripts ou des workflows d’automatisation.

## Installation

```bash
npm install @caixuan-cc/sdk
```

Nécessite Node.js >= 18.

## Démarrage rapide

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// Obtenir la session actuelle
const session = await client.session.get();

// Lister les espaces
const { rows: spaces } = await client.spaces.list();

// Téléverser un fichier et créer un document
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## Initialiser le client

Créez une instance de client avec `createCaixuan()` :

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // URL racine de l’API, par défaut https://app.caixuan.cc/api
  token: 'your-auth-token',     // Token utilisateur (en-tête X-Auth-Token)
  spaceId: 'space-id',          // ID de l’espace actuel (optionnel ; résolu automatiquement si omis)
  userId: 'user-id',            // ID utilisateur (optionnel)
  lang: 'en',                   // Langue : 'zh' | 'en'
  basicAuth: 'user:pass',       // Basic Auth nginx (optionnel)
  onUnauthorized: async () => { // Actualiser le token à l’expiration (optionnel)
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

Vous pouvez également mettre à jour les identifiants après la création du client :

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### Obtenir un token

- Effectuez la connexion OAuth dans l’application web Caixuan
- Ou utilisez la CLI : exécutez `caixuan login`, puis `caixuan config show`

### Résolution de l’ID d’espace

La plupart des API nécessitent un `spaceId`. Si aucun n’est fourni à l’initialisation, le SDK le résout dans cet ordre :

1. `spaceId` défini explicitement
2. `defaultSpace.id` depuis `/session`

## Modules API

Accédez aux API de ressources via les espaces de noms du client :

| Module | Description |
|--------|-------------|
| `client.session` | Session (utilisateur actuel, déconnexion) |
| `client.spaces` | Liste, détails et changement d’espace |
| `client.shares` | CRUD des liens de partage |
| `client.docs` | CRUD des documents |
| `client.members` | Gestion des membres de l’espace |
| `client.files` | Téléversement de fichiers |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // Espace actuel
const current = await client.spaces.current();     // Depuis la session
await client.spaces.select('space-id');            // Changer et définir par défaut
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: 'Mon partage',
  description: 'Description optionnelle',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: 'Nouveau nom', password: '1234' });
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
await client.members.rename(undefined, 'user-id', 'Nouveau nom');
await client.members.remove(undefined, 'user-id');
```

### Files (téléversement)

Prend en charge les chemins de fichiers locaux ou les données binaires, avec téléversement automatique en fichier unique ou multipart :

```typescript
// Téléverser un fichier local
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// Téléverser des données binaires (name requis)
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

Flux de travail typique : appelez `files.upload()` pour obtenir `fileId`, puis `docs.create()` pour créer le document.

## Pagination

Les points de terminaison de liste renvoient `ListResult<T>` :

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

Paramètres de pagination :

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## Gestion des erreurs

Le SDK encapsule les erreurs API sous forme de `APIError` :

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // Code de statut HTTP
    console.error(err.code);          // Code d’erreur métier
    console.error(err.requestId);     // ID de traçage de la requête
    console.error(err.requestUrl);    // URL de la requête
    console.error(err.requestPayload);// Corps de la requête
  }

  if (isRetriableError(err)) {
    // Erreurs réseau ou 502/604 — réessai possible
  }
}
```

Le SDK réessaie automatiquement les erreurs récupérables (timeouts réseau, 502, 604) avec un backoff exponentiel.

En cas de 401 Unauthorized, si `onUnauthorized` est configuré, le SDK actualise le token et réessaie la requête.

## Export de types

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

## Licence

[MIT](../../LICENSE)
