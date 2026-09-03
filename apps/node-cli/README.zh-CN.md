# Caixuan CLI

> [English](README.md) · **中文** · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[Caixuan](https://app.caixuan.cc) 平台的命令行工具，用于在终端或自动化脚本中管理空间、分享、文档与空间成员。

## 环境要求

- Node.js >= 18

## 安装

```bash
npm install -g @caixuan-cc/cli
```

## 认证

```bash
# 浏览器 OAuth（需要 Web 端 /cli/auth 页面）
caixuan login

# 或手动设置 Token
caixuan config set-token <token>
caixuan config show
```

配置保存在 `~/.caixuan/config.json`。

环境变量覆盖：

- `CAIXUAN_CONFIG_DIR` — 配置目录
- `CAIXUAN_API_BASE` — API 基础地址（默认 `https://app.caixuan.cc/api`）

## 快速开始

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## 典型场景

上传并分享、密码保护、限时失效、付费查看、邀请成员、CI 自动发布等端到端示例，见 **[docs/use-cases.zh-CN.md](docs/use-cases.zh-CN.md)**。

## 命令概览

| 分组 | 命令 |
|------|------|
| 认证 | `login`, `logout` |
| 配置 | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| 空间 | `space list`, `space current`, `space select`, `space get` |
| 分享 | `share list`, `share get`, `share create`, `share update`, `share delete` |
| 文档 | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| 成员 | `member list`, `member get`, `member create`, `member update`, `member delete` |

## JSON 输出（适合 AI Agent）

任意命令加上 `--json` 可输出结构化数据：

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## 许可证

[MIT](../../LICENSE)
