# Caixuan CLI

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · **Русский** · [日本語](README.ja.md) · [한국어](README.ko.md)

Инструмент командной строки для платформы [Caixuan](https://app.caixuan.cc). Управляйте пространствами, ссылками, документами и участниками из терминала или в скриптах автоматизации.

## Требования

- Node.js >= 18

## Установка

```bash
npm install -g @caixuan-cc/cli
```

## Аутентификация

```bash
# OAuth через браузер (требуется веб-страница /cli/auth)
caixuan login

# Или задать токен вручную
caixuan config set-token <token>
caixuan config show
```

Конфигурация хранится в `~/.caixuan/config.json`.

Переменные окружения:

- `CAIXUAN_CONFIG_DIR` — каталог конфигурации
- `CAIXUAN_API_BASE` — базовый URL API (по умолчанию `https://app.caixuan.cc/api`)

## Быстрый старт

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## Обзор команд

| Группа | Команды |
|--------|---------|
| Auth | `login`, `logout` |
| Config | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| Пространство | `space list`, `space current`, `space select`, `space get` |
| Ссылка | `share list`, `share get`, `share create`, `share update`, `share delete` |
| Документ | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| Участник | `member list`, `member get`, `member create`, `member update`, `member delete` |

## JSON-вывод (удобно для AI-агентов)

Добавьте `--json` к любой команде для структурированного вывода:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## Лицензия

[MIT](../../LICENSE)
