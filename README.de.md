# Caixuan CLI & SDK

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · **Deutsch** · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Befehlszeilentool und TypeScript-SDK für die [Caixuan](https://app.caixuan.cc)-Plattform. Verwalten Sie Bereiche, Freigaben, Dokumente und Mitglieder über Terminal, Skripte oder serverseitig.

Erfordert Node.js >= 18.

## CLI

Paket: `@caixuan-cc/cli`. Nach der Installation steht der Befehl `caixuan` zur Verfügung.

### Installation

```bash
npm install -g @caixuan-cc/cli
```

### Schnellstart

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

Weitere Befehle, Authentifizierung und JSON-Ausgabeformate finden Sie in **[apps/node-cli/README.de.md](apps/node-cli/README.de.md)**.

## SDK (TypeScript)

Paket: `@caixuan-cc/sdk`. Rufen Sie die Caixuan-API aus Node.js-Anwendungen auf.

### Installation

```bash
npm install @caixuan-cc/sdk
```

### Schnellstart

```typescript
import { createCaixuan } from '@caixuan-cc/sdk';

const client = createCaixuan({ token: process.env.CAIXUAN_TOKEN });

const { rows: spaces } = await client.spaces.list();
const file = await client.files.upload('./deck.pptx');
const doc = await client.docs.create({
  spaceId: spaces[0].id,
  fileId: file.id,
  name: file.name,
});
```

Vollständige API-Referenz, Initialisierungsoptionen, Fehlerbehandlung und Upload-Workflows finden Sie in **[sdks/typescript/README.de.md](sdks/typescript/README.de.md)**.

## Lizenz

[MIT](LICENSE)
