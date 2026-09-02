# Caixuan CLI

> [English](README.md) · [中文](README.zh-CN.md) · **Français** · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Outil en ligne de commande pour la plateforme [Caixuan](https://app.caixuan.cc). Gérez espaces, partages, documents et membres depuis le terminal ou dans des scripts d'automatisation.

## Prérequis

- Node.js >= 18

## Installation

```bash
npm install -g @caixuan-cc/cli
```

## Authentification

```bash
# OAuth via navigateur (nécessite la page Web /cli/auth)
caixuan login

# Ou définir le token manuellement
caixuan config set-token <token>
caixuan config show
```

La configuration est stockée dans `~/.caixuan/config.json`.

Variables d'environnement :

- `CAIXUAN_CONFIG_DIR` — répertoire de configuration
- `CAIXUAN_API_BASE` — URL de base de l'API (par défaut `https://app.caixuan.cc/api`)

## Démarrage rapide

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## Aperçu des commandes

| Groupe | Commandes |
|--------|-----------|
| Auth | `login`, `logout` |
| Config | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| Espace | `space list`, `space current`, `space select`, `space get` |
| Partage | `share list`, `share get`, `share create`, `share update`, `share delete` |
| Document | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| Membre | `member list`, `member get`, `member create`, `member update`, `member delete` |

## Sortie JSON (adaptée aux agents IA)

Ajoutez `--json` à n'importe quelle commande pour une sortie structurée :

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## Licence

[MIT](../../LICENSE)
