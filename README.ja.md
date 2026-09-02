# Caixuan CLI & SDK

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · **日本語** · [한국어](README.ko.md)

[Caixuan](https://app.caixuan.cc) プラットフォーム向けのコマンドラインツールと TypeScript SDK。ターミナル、スクリプト、サーバーからスペース、共有、ドキュメント、メンバーを管理できます。

Node.js >= 18 が必要です。

## CLI

パッケージ: `@caixuan-cc/cli`。インストール後、`caixuan` コマンドが利用できます。

### インストール

```bash
npm install -g @caixuan-cc/cli
```

### クイックスタート

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

コマンド一覧、認証設定、JSON 出力形式の詳細は **[apps/node-cli/README.ja.md](apps/node-cli/README.ja.md)** を参照してください。

## SDK (TypeScript)

パッケージ: `@caixuan-cc/sdk`。Node.js アプリケーションから Caixuan API を呼び出します。

### インストール

```bash
npm install @caixuan-cc/sdk
```

### クイックスタート

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

API リファレンス、初期化オプション、エラー処理、アップロード手順の詳細は **[sdks/typescript/README.ja.md](sdks/typescript/README.ja.md)** を参照してください。

## ライセンス

[MIT](LICENSE)
