# Caixuan CLI

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **한국어**

[Caixuan](https://app.caixuan.cc) 플랫폼용 명령줄 도구. 터미널 또는 자동화 스크립트에서 스페이스, 공유, 문서, 멤버를 관리합니다.

## 요구 사항

- Node.js >= 18

## 설치

```bash
npm install -g @caixuan-cc/cli
```

## 인증

```bash
# 브라우저 OAuth (Web /cli/auth 페이지 필요)
caixuan login

# 또는 토큰을 수동으로 설정
caixuan config set-token <token>
caixuan config show
```

설정은 `~/.caixuan/config.json`에 저장됩니다.

환경 변수:

- `CAIXUAN_CONFIG_DIR` — 설정 디렉터리
- `CAIXUAN_API_BASE` — API 기본 URL (기본값 `https://app.caixuan.cc/api`)

## 빠른 시작

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
caixuan member list
```

## 명령 개요

| 그룹 | 명령 |
|------|------|
| 인증 | `login`, `logout` |
| 설정 | `config show`, `config set-token`, `config set-space`, `config set-api-base` |
| 스페이스 | `space list`, `space current`, `space select`, `space get` |
| 공유 | `share list`, `share get`, `share create`, `share update`, `share delete` |
| 문서 | `doc list`, `doc get`, `doc create`, `doc update`, `doc delete` |
| 멤버 | `member list`, `member get`, `member create`, `member update`, `member delete` |

## JSON 출력 (AI 에이전트 친화적)

모든 명령에 `--json`을 추가하면 구조화된 출력을 받을 수 있습니다:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "count": 42 }
}
```

## 라이선스

[MIT](../../LICENSE)
