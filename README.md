# Caixuan CLI & SDK

[Caixuan](https://app.caixuan.cc) 平台的命令行工具与 TypeScript SDK，用于在终端、脚本或服务端管理空间、分享、文档与成员。

## 项目结构

```
caixuan-cli/
├── apps/node-cli/     # @caixuan-cc/cli — 命令行工具
└── sdks/typescript/   # @caixuan-cc/sdk  — TypeScript SDK
```

## CLI（命令行工具）

### 安装

```bash
npm install -g @caixuan-cc/cli
# 或
pnpm add -g @caixuan-cc/cli
```

### 快速使用

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

更多命令说明、认证配置、JSON 输出格式及开发指南，请参阅 **[apps/node-cli/README.md](apps/node-cli/README.md)**。

## SDK（TypeScript）

### 安装

```bash
npm install @caixuan-cc/sdk
# 或
pnpm add @caixuan-cc/sdk
```

### 快速使用

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

完整的 API 文档、初始化选项、错误处理及上传流程，请参阅 **[sdks/typescript/README.md](sdks/typescript/README.md)**。

## 本地开发

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

全局安装 CLI（开发模式）：

```bash
pnpm install:global
```

## License

[MIT](LICENSE)
