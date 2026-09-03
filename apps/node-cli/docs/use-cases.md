# Typical use cases

> **English** · [中文](use-cases.zh-CN.md)

These scenarios assume the CLI is installed, you are logged in, and a space is selected:

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
```

Replace `doc…`, `share…`, and `user…` with real IDs. Add `--json` for structured output that scripts can parse.

---

## 1. Upload a document and get a share link

**When:** You finished a PPT/PDF and want to send it to a client or teammate right away.

```bash
caixuan doc create --file ./quarterly-review.pptx --name "2026 Q1 Review" --json

caixuan share create --name "Q1 Review" --doc <doc-id> --json

caixuan share get-link <share-id>
# → https://s.caixuan.cc/<link-id>
```

Send the URL printed by `get-link`.

---

## 2. Password-protected share

**When:** The link may be forwarded; only people with the password should open it.

```bash
caixuan doc create --file ./internal-plan.pptx --json

caixuan share create \
  --name "Internal plan (locked)" \
  --doc <doc-id> \
  --view-control password \
  --password ab12 \
  --json

caixuan share get-link <share-id>
```

Password is at most 4 characters. Or lock an existing share:

```bash
caixuan share update <share-id> --view-control password --password ab12
```

---

## 3. Expiring share

**When:** Bid materials or a limited preview that should stop working after a date.

```bash
caixuan share create --name "Bid preview" --doc <doc-id> --json

caixuan share update <share-id> --expired-at 2026-09-30T23:59:59.000Z

caixuan share get-link <share-id>
```

Clear expiration:

```bash
caixuan share update <share-id> --expired-at null
```

---

## 4. Secure share: watermark + no download

**When:** External demo — discourage leaks and block original-file download.

```bash
caixuan share create --name "Client demo" --doc <doc-id> --json

caixuan share update <share-id> \
  --watermark both \
  --download notAllowed \
  --allow-viewer-share no \
  --file-watermark "For demo only" \
  --watermark-color "#cccccc"

caixuan share get-link <share-id>
```

`--download`: `notAllowed` | `pdf` | `pptx` | `pdfPptx`.  
`--watermark`: `none` | `user` | `viewer` | `both`.

---

## 5. Add / remove documents in an existing share

**When:** One share page should hold multiple files, or you need to swap one out.

```bash
caixuan share add-doc <share-id> <doc-id-2>
caixuan share remove-doc <share-id> <doc-id-1>
caixuan share get <share-id>
```

Attach multiple docs at create time:

```bash
caixuan share create --name "Pack" --doc <doc-a> --doc <doc-b>
```

---

## 6. Paid access share

**When:** Course notes or a paid report that viewers must purchase to unlock.

```bash
caixuan share create --name "Paid report" --doc <doc-id> --json

caixuan share update <share-id> \
  --view-control buy \
  --price 9900 \
  --paid-interval '{"unit":"month","value":1}' \
  --public-buyer-and-message yes

caixuan share get-link <share-id>
```

`--price` is in the smallest currency unit (e.g. cents).

---

## 7. Collect viewer contact info

**When:** A marketing page that asks for phone/email before viewing.

```bash
caixuan share create --name "Product intro" --doc <doc-id> --json

caixuan share update <share-id> \
  --view-control contact \
  --allow-leave-contact yes \
  --contact-type mobile \
  --need-phone yes

caixuan share get-link <share-id>
```

`--contact-type`: `none` | `mobile` | `email` | `wechat`.

---

## 8. Invite teammates to a space

**When:** Onboarding a colleague or cross-team collaboration on the same docs.

```bash
caixuan member create --role teammate --mobile 13800138000 --name "Alex"
caixuan member create --role manager --email alice@example.com

caixuan member list --table
caixuan member update <user-id> --role manager
caixuan member delete <user-id>
```

Roles: `manager` | `teammate` | `guest`.

---

## 9. Switch between spaces

**When:** You work across personal and team workspaces.

```bash
caixuan space list --table
caixuan space select              # interactive
# or
caixuan space select <space-id>

caixuan space current
caixuan doc list --table
```

The selected space is persisted; later `doc` / `share` / `member` commands use it.

---

## 10. Download a document for backup

**When:** Pull the latest release to disk for archive or local editing.

```bash
caixuan doc list --name review --table
caixuan doc down <doc-id> -o ./backup/quarterly-review.pptx
```

---

## 11. Script / CI auto-publish

**When:** A build artifact should upload and emit a share URL automatically.

```bash
#!/usr/bin/env bash
set -euo pipefail

DOC_JSON=$(caixuan doc create --file ./dist/deck.pptx --name "Nightly Build" --json)
DOC_ID=$(echo "$DOC_JSON" | jq -r '.data.id')

SHARE_JSON=$(caixuan share create --name "Nightly" --doc "$DOC_ID" --json)
SHARE_ID=$(echo "$SHARE_JSON" | jq -r '.data.id')

caixuan share get-link "$SHARE_ID" --json
# Use .data.url in your pipeline notification
```

With `--json`, every command returns:

```json
{ "ok": true, "data": { ... }, "meta": { ... } }
```

---

## 12. Find, rename, and clean up

**When:** The space is cluttered; search by name, rename, or delete stale items.

```bash
caixuan doc list --name draft --table
caixuan doc update <doc-id> --name "Final - client approved"

caixuan share list --name old --table
caixuan share delete <share-id>
caixuan doc delete <doc-id>
```

---

## Quick reference

| Goal | Command chain |
|------|----------------|
| Upload & share | `doc create` → `share create --doc` → `share get-link` |
| Password lock | `share create/update --view-control password --password …` |
| Expire | `share update --expired-at <ISO>` |
| No download / watermark | `share update --download notAllowed --watermark both` |
| Multi-doc page | `share add-doc` / `share create --doc … --doc …` |
| Invite | `member create --role …` |
| Automation | Always `--json`, parse `id` / `url` with `jq` |
