# Caixuan CLI & SDK

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **한국어**

[Caixuan](https://app.caixuan.cc) 플랫폼용 명령줄 도구 및 TypeScript SDK. 터미널, 스크립트 또는 서버에서 스페이스, 공유, 문서, 멤버를 관리할 수 있습니다.

Node.js >= 18 필요.

## CLI

패키지: `@caixuan-cc/cli`. 설치 후 `caixuan` 명령을 사용할 수 있습니다.

### 설치

```bash
npm install -g @caixuan-cc/cli
```

### 빠른 시작

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

더 많은 명령, 인증 설정 및 JSON 출력 형식은 **[apps/node-cli/README.ko.md](apps/node-cli/README.ko.md)** 를 참조하세요.

## SDK (TypeScript)

패키지: `@caixuan-cc/sdk`. Node.js 애플리케이션에서 Caixuan API를 호출합니다.

### 설치

```bash
npm install @caixuan-cc/sdk
```

### 빠른 시작

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

전체 API 참조, 초기화 옵션, 오류 처리 및 업로드 워크플로는 **[sdks/typescript/README.ko.md](sdks/typescript/README.ko.md)** 를 참조하세요.

## 라이선스

[MIT](LICENSE)
