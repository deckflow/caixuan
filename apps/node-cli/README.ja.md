# Caixuan CLI

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · **日本語** · [한국어](README.ko.md)

[Caixuan](https://app.caixuan.cc) プラットフォーム向けのコマンドラインツール。ターミナルや自動化スクリプトからスペース、共有、ドキュメント、メンバーを管理できます。

## 要件

- Node.js >= 18

## インストール

```bash
npm install -g @caixuan-cc/cli
```

## 認証

```bash
# ブラウザ OAuth（Web の /cli/auth ページが必要）
caixuan login

# または手動でトークンを設定
caixuan config set-token <token>
caixuan config show
```

設定は `~/.caixuan/config.json` に保存されます。

環境変数による上書き:

- `CAIXUAN_CONFIG_DIR` — 設定ディレクトリ
- `CAIXUAN_API_BASE` — API ベース URL（デフォルト `https://app.caixuan.cc/api`）

## クイックスタート

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## コマンド一覧

| グループ | コマンド |
|----------|----------|
| 認証 | `login`, `logout` |
| 設定 | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| スペース | `space list`, `space current`, `space select`, `space get` |
| 共有 | `share list`, `share get`, `share create`, `share update`, `share delete` |
| ドキュメント | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| メンバー | `member list`, `member get`, `member create`, `member update`, `member delete` |

## JSON 出力（AI エージェント向け）

任意のコマンドに `--json` を付けると構造化出力になります:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## ライセンス

[MIT](../../LICENSE)
