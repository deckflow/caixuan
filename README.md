# Caixuan CLI

Command-line tool for the [Caixuan](https://app.caixuan.cc) platform. Manage spaces, shares, documents, and space members from the terminal or in automation scripts.

## Requirements

- Node.js >= 18
- pnpm >= 9

## Install (development)

```bash
pnpm install
pnpm build
pnpm install:global
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

## Project structure

```
caixuan-cli/
├── apps/node-cli/     # `caixuan` CLI binary
└── sdks/typescript/   # @caixuan/sdk
```

## Development

```bash
pnpm test
pnpm typecheck
pnpm build
```

## License

[MIT](LICENSE)
