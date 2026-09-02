# Caixuan CLI & SDK

> [English](README.md) · [中文](README.zh-CN.md) · [Français](README.fr.md) · **Español** · [Deutsch](README.de.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Herramienta de línea de comandos y SDK de TypeScript para la plataforma [Caixuan](https://app.caixuan.cc). Gestione espacios, enlaces compartidos, documentos y miembros desde la terminal, scripts o el servidor.

Requiere Node.js >= 18.

## CLI

Paquete: `@caixuan-cc/cli`. Tras la instalación, el comando `caixuan` está disponible.

### Instalación

```bash
npm install -g @caixuan-cc/cli
```

### Inicio rápido

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
caixuan share list --json
caixuan doc create --file ./deck.pptx
```

Para más comandos, configuración de autenticación y formato de salida JSON, consulte **[apps/node-cli/README.es.md](apps/node-cli/README.es.md)**.

## SDK (TypeScript)

Paquete: `@caixuan-cc/sdk`. Llame a la API de Caixuan desde aplicaciones Node.js.

### Instalación

```bash
npm install @caixuan-cc/sdk
```

### Inicio rápido

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

Para la referencia completa de la API, opciones de inicialización, manejo de errores y flujos de carga, consulte **[sdks/typescript/README.es.md](sdks/typescript/README.es.md)**.

## Licencia

[MIT](LICENSE)
