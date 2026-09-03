# Caixuan CLI & SDK

> **English** · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Command-line tool and TypeScript SDK for the [Caixuan](https://app.caixuan.cc) platform. Use them from the terminal, scripts, or server-side to manage spaces, shares, documents, and members.

Requires Node.js >= 18.

## CLI

Package: `@caixuan-cc/cli`. After installation, the `caixuan` command is available.

### Installation

```bash
npm install -g @caixuan-cc/cli
```

### Quick start

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

For more commands, authentication setup, and JSON output formats, see **[apps/node-cli/README.md](apps/node-cli/README.md)**.

Typical use cases (upload & share, password links, expiry, CI publish, and more): **[apps/node-cli/docs/use-cases.md](apps/node-cli/docs/use-cases.md)**.

## SDK (TypeScript)

Package: `@caixuan-cc/sdk`. Call the Caixuan API from Node.js applications.

### Installation

```bash
npm install @caixuan-cc/sdk
```

### Quick start

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

For full API reference, initialization options, error handling, and upload workflows, see **[sdks/typescript/README.md](sdks/typescript/README.md)**.

## License

[MIT](LICENSE)
