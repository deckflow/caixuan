# Caixuan CLI & SDK

> [English](README.md) · **中文** · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[Caixuan](https://app.caixuan.cc) 平台的命令行工具与 TypeScript SDK，用于在终端、脚本或服务端管理空间、分享、文档与成员。

要求 Node.js >= 18。

## CLI（命令行工具）

包名：`@caixuan-cc/cli`，安装后可用 `caixuan` 命令。

### 安装

```bash
npm install -g @caixuan-cc/cli
```

### 快速开始

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

更多命令说明、认证配置及 JSON 输出格式，请参阅 **[apps/node-cli/README.zh-CN.md](apps/node-cli/README.zh-CN.md)**。

## SDK（TypeScript）

包名：`@caixuan-cc/sdk`，用于在 Node.js 程序中调用 Caixuan API。

### 安装

```bash
npm install @caixuan-cc/sdk
```

### 快速开始

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

完整的 API 文档、初始化选项、错误处理及上传流程，请参阅 **[sdks/typescript/README.zh-CN.md](sdks/typescript/README.zh-CN.md)**。

## 许可证

[MIT](LICENSE)
