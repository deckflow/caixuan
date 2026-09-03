# Caixuan CLI

> **English** · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Command-line tool for the [Caixuan](https://app.caixuan.cc) platform. Manage spaces, shares, documents, and space members from the terminal or in automation scripts.

## Requirements

- Node.js >= 18

## Installation

```bash
npm install -g @caixuan-cc/cli
```

## Authentication

```bash
# Browser OAuth (requires Web /cli/auth page)
caixuan login

# Or set token manually
caixuan config set-token <token>
caixuan config show
```

Configuration is stored in `~/.caixuan/config.json`.

Environment overrides:

- `CAIXUAN_CONFIG_DIR` — config directory
- `CAIXUAN_API_BASE` — API base URL (default `https://app.caixuan.cc/api`)

## Quick start

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## Typical use cases

End-to-end examples (upload & share, password lock, expiry, paid access, invite members, CI publish, and more): **[docs/use-cases.md](docs/use-cases.md)**.

## Command overview

| Group | Commands |
|-------|----------|
| Auth | `login`, `logout` |
| Config | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| Space | `space list`, `space current`, `space select`, `space get` |
| Share | `share list`, `share get`, `share create`, `share update`, `share delete` |
| Doc | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| Member | `member list`, `member get`, `member create`, `member update`, `member delete` |

## JSON output (AI-agent friendly)

Pass `--json` on any command for structured output:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## License

[MIT](../../LICENSE)
