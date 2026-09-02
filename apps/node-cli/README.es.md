# Caixuan CLI

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · **Español** · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Herramienta de línea de comandos para la plataforma [Caixuan](https://app.caixuan.cc). Gestione espacios, enlaces compartidos, documentos y miembros desde la terminal o en scripts de automatización.

## Requisitos

- Node.js >= 18

## Instalación

```bash
npm install -g @caixuan-cc/cli
```

## Autenticación

```bash
# OAuth en el navegador (requiere la página Web /cli/auth)
caixuan login

# O configurar el token manualmente
caixuan config set-token <token>
caixuan config show
```

La configuración se guarda en `~/.caixuan/config.json`.

Variables de entorno:

- `CAIXUAN_CONFIG_DIR` — directorio de configuración
- `CAIXUAN_API_BASE` — URL base de la API (predeterminado `https://app.caixuan.cc/api`)

## Inicio rápido

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## Resumen de comandos

| Grupo | Comandos |
|-------|----------|
| Auth | `login`, `logout` |
| Config | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| Espacio | `space list`, `space current`, `space select`, `space get` |
| Compartir | `share list`, `share get`, `share create`, `share update`, `share delete` |
| Documento | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| Miembro | `member list`, `member get`, `member create`, `member update`, `member delete` |

## Salida JSON (compatible con agentes IA)

Añada `--json` a cualquier comando para obtener salida estructurada:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## Licencia

[MIT](../../LICENSE)
