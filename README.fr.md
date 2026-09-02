# Caixuan CLI & SDK

> [English](README.md) · [中文](README.zh-CN.md) · **Français** · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Outil en ligne de commande et SDK TypeScript pour la plateforme [Caixuan](https://app.caixuan.cc). Gérez espaces, partages, documents et membres depuis le terminal, des scripts ou côté serveur.

Nécessite Node.js >= 18.

## CLI

Package : `@caixuan-cc/cli`. Après installation, la commande `caixuan` est disponible.

### Installation

```bash
npm install -g @caixuan-cc/cli
```

### Démarrage rapide

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

Pour plus de commandes, la configuration d'authentification et le format de sortie JSON, consultez **[apps/node-cli/README.fr.md](apps/node-cli/README.fr.md)**.

## SDK (TypeScript)

Package : `@caixuan-cc/sdk`. Appelez l'API Caixuan depuis des applications Node.js.

### Installation

```bash
npm install @caixuan-cc/sdk
```

### Démarrage rapide

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

Pour la référence API complète, les options d'initialisation, la gestion des erreurs et les flux d'upload, consultez **[sdks/typescript/README.fr.md](sdks/typescript/README.fr.md)**.

## Licence

[MIT](LICENSE)
