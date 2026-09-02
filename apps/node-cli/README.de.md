# Caixuan CLI

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · **Deutsch** · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Befehlszeilentool für die [Caixuan](https://app.caixuan.cc)-Plattform. Verwalten Sie Bereiche, Freigaben, Dokumente und Mitglieder über das Terminal oder in Automatisierungsskripten.

## Voraussetzungen

- Node.js >= 18

## Installation

```bash
npm install -g @caixuan-cc/cli
```

## Authentifizierung

```bash
# Browser-OAuth (erfordert Web-Seite /cli/auth)
caixuan login

# Oder Token manuell setzen
caixuan config set-token <token>
caixuan config show
```

Die Konfiguration wird in `~/.caixuan/config.json` gespeichert.

Umgebungsvariablen:

- `CAIXUAN_CONFIG_DIR` — Konfigurationsverzeichnis
- `CAIXUAN_API_BASE` — API-Basis-URL (Standard `https://app.caixuan.cc/api`)

## Schnellstart

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## Befehlsübersicht

| Gruppe | Befehle |
|--------|---------|
| Auth | `login`, `logout` |
| Config | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| Bereich | `space list`, `space current`, `space select`, `space get` |
| Freigabe | `share list`, `share get`, `share create`, `share update`, `share delete` |
| Dokument | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| Mitglied | `member list`, `member get`, `member create`, `member update`, `member delete` |

## JSON-Ausgabe (KI-Agent-freundlich)

Mit `--json` erhalten Sie strukturierte Ausgabe für jeden Befehl:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## Lizenz

[MIT](../../LICENSE)
