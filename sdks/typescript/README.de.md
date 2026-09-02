# @caixuan-cc/sdk

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · **[Deutsch](README.de.md)** · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

TypeScript-SDK für die [Caixuan](https://app.caixuan.cc)-Plattform. Integrieren Sie die Caixuan-API aus Node.js-Diensten, Skripten oder Automatisierungs-Workflows.

## Installation

```bash
npm install @caixuan-cc/sdk
```

Erfordert Node.js >= 18.

## Schnellstart

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({
  token: process.env.CAIXUAN_TOKEN,
  spaceId: process.env.CAIXUAN_SPACE_ID,
});

// Aktuelle Sitzung abrufen
const session = await client.session.get();

// Spaces auflisten
const { rows: spaces } = await client.spaces.list();

// Datei hochladen und Dokument erstellen
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

## Client initialisieren

Erstellen Sie eine Client-Instanz mit `createCaixuan()`:

```typescript
import { createCaixuan, DEFAULT_ROOT } from '@caixuan-cc/sdk';

const client = createCaixuan({
  root: DEFAULT_ROOT,           // API-Stamm-URL, Standard https://app.caixuan.cc/api
  token: 'your-auth-token',     // Benutzer-Token (X-Auth-Token-Header)
  spaceId: 'space-id',          // Aktuelle Space-ID (optional; wird automatisch aufgelöst, wenn nicht angegeben)
  userId: 'user-id',            // Benutzer-ID (optional)
  lang: 'en',                   // Sprache: 'zh' | 'en'
  basicAuth: 'user:pass',       // nginx Basic Auth (optional)
  onUnauthorized: async () => { // Token bei Ablauf aktualisieren (optional)
    const newToken = await refreshToken();
    return { token: newToken };
  },
});
```

Sie können Anmeldedaten auch nach der Client-Erstellung aktualisieren:

```typescript
client.setToken('new-token');
client.setSpaceId('space-id');
client.setUserId('user-id');
client.setBasicAuth('user:pass');
```

### Token erhalten

- OAuth-Anmeldung in der Caixuan-Web-App abschließen
- Oder die CLI verwenden: `caixuan login` ausführen, dann `caixuan config show`

### Auflösung der Space-ID

Die meisten APIs erfordern eine `spaceId`. Wird keine bei der Initialisierung angegeben, löst das SDK sie in dieser Reihenfolge auf:

1. Explizit gesetzte `spaceId`
2. `defaultSpace.id` aus `/session`

## API-Module

Greifen Sie über Namespaces am Client auf Ressourcen-APIs zu:

| Modul | Beschreibung |
|-------|--------------|
| `client.session` | Sitzung (aktueller Benutzer, Abmeldung) |
| `client.spaces` | Space-Liste, Details, Wechsel |
| `client.shares` | Freigabe-Link-CRUD |
| `client.docs` | Dokument-CRUD |
| `client.members` | Space-Mitgliederverwaltung |
| `client.files` | Datei-Upload |

### Session

```typescript
const session = await client.session.get();
// session.id, session.defaultSpace, ...

await client.session.logout();
```

### Spaces

```typescript
const { rows, count } = await client.spaces.list();
const space = await client.spaces.get();           // Aktueller Space
const current = await client.spaces.current();     // Aus der Session
await client.spaces.select('space-id');            // Wechseln und als Standard setzen
```

### Shares

```typescript
const { rows } = await client.shares.list(undefined, { _startIndex: 0, _maxResults: 20 });
const share = await client.shares.get('share-id', ['content']);

const created = await client.shares.create({
  spaceId: 'space-id',
  name: 'Meine Freigabe',
  description: 'Optionale Beschreibung',
  content: [{ _type: 'doc', id: 'doc-id' }],
  needPhone: 'no',
});

await client.shares.update({ id: 'share-id', name: 'Neuer Name', password: '1234' });
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
await client.members.rename(undefined, 'user-id', 'Neuer Name');
await client.members.remove(undefined, 'user-id');
```

### Files (Upload)

Unterstützt lokale Dateipfade oder Binärdaten mit automatischem Einzeldatei- und Multipart-Upload:

```typescript
// Lokale Datei hochladen
const result = await client.files.upload('./presentation.pptx', {
  spaceId: 'space-id',
  onProgress: (pct) => console.log(`${Math.round(pct * 100)}%`),
});
// result: { id, name, bytes, hash }

// Binärdaten hochladen (name erforderlich)
const buffer = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));
const result2 = await client.files.upload(buffer, {
  spaceId: 'space-id',
  name: 'remote-file.pptx',
});
```

Typischer Workflow: `files.upload()` aufrufen, um `fileId` zu erhalten, dann `docs.create()`, um das Dokument zu erstellen.

## Paginierung

Listen-Endpunkte geben `ListResult<T>` zurück:

```typescript
interface ListResult<T> {
  rows: T[];
  count: number;
}
```

Paginierungsparameter:

```typescript
await client.shares.list(undefined, { _startIndex: 0, _maxResults: 50 });
```

## Fehlerbehandlung

Das SDK kapselt API-Fehler als `APIError`:

```typescript
import { APIError, isRetriableError } from '@caixuan-cc/sdk';

try {
  await client.docs.get('invalid-id');
} catch (err) {
  if (err instanceof APIError) {
    console.error(err.statusCode);    // HTTP-Statuscode
    console.error(err.code);          // Geschäftsfehlercode
    console.error(err.requestId);     // Request-Trace-ID
    console.error(err.requestUrl);    // Request-URL
    console.error(err.requestPayload);// Request-Body
  }

  if (isRetriableError(err)) {
    // Netzwerkfehler oder 502/604 — Wiederholung sicher
  }
}
```

Das SDK wiederholt wiederholbare Fehler (Netzwerk-Timeouts, 502, 604) automatisch mit exponentiellem Backoff.

Bei 401 Unauthorized aktualisiert das SDK bei konfiguriertem `onUnauthorized` den Token und wiederholt die Anfrage.

## Typ-Exporte

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

## Lizenz

[MIT](../../LICENSE)
