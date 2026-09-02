# Caixuan CLI & SDK

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · **Русский** · [日本語](README.ja.md) · [한국어](README.ko.md)

Инструмент командной строки и TypeScript SDK для платформы [Caixuan](https://app.caixuan.cc). Управляйте пространствами, ссылками, документами и участниками из терминала, скриптов или на сервере.

Требуется Node.js >= 18.

## CLI

Пакет: `@caixuan-cc/cli`. После установки доступна команда `caixuan`.

### Установка

```bash
npm install -g @caixuan-cc/cli
```

### Быстрый старт

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

Подробнее о командах, настройке аутентификации и формате JSON см. **[apps/node-cli/README.ru.md](apps/node-cli/README.ru.md)**.

## SDK (TypeScript)

Пакет: `@caixuan-cc/sdk`. Вызывайте API Caixuan из приложений Node.js.

### Установка

```bash
npm install @caixuan-cc/sdk
```

### Быстрый старт

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

Полный справочник API, параметры инициализации, обработка ошибок и загрузка файлов — в **[sdks/typescript/README.ru.md](sdks/typescript/README.ru.md)**.

## Лицензия

[MIT](LICENSE)
