# 典型使用场景

> [English](use-cases.md) · **中文**

以下场景均假设已完成安装与登录，并已选中目标空间：

```bash
caixuan login
caixuan space list
caixuan space select <space-id>
```

命令中的 `doc…`、`share…`、`user…` 请替换为实际 ID。加 `--json` 可得到结构化输出，便于脚本解析。

---

## 1. 上传文档并生成分享链接

**场景：** 做完一版 PPT / PDF，想立刻发给客户或同事查看。

```bash
# 上传并创建文档
caixuan doc create --file ./季度汇报.pptx --name "2026 Q1 季度汇报" --json

# 用返回的文档 ID 创建分享
caixuan share create --name "Q1 汇报" --doc <doc-id> --json

# 取出可公开访问的链接
caixuan share get-link <share-id>
# → https://s.caixuan.cc/<link-id>
```

把 `get-link` 打印出的 URL 发给对方即可。

---

## 2. 密码保护的分享

**场景：** 链接可能被转发，希望只有知道密码的人能打开。

```bash
caixuan doc create --file ./内部方案.pptx --json

caixuan share create \
  --name "内部方案（加密）" \
  --doc <doc-id> \
  --view-control password \
  --password ab12 \
  --json

caixuan share get-link <share-id>
```

密码最长 4 个字符。也可对已有分享补设：

```bash
caixuan share update <share-id> --view-control password --password ab12
```

---

## 3. 限时分享（到期自动失效）

**场景：** 投标材料、限时预览，过期后链接不可用。

```bash
caixuan share create --name "投标预览" --doc <doc-id> --json

caixuan share update <share-id> --expired-at 2026-09-30T23:59:59.000Z

caixuan share get-link <share-id>
```

清除过期时间：

```bash
caixuan share update <share-id> --expired-at null
```

---

## 4. 安全分享：水印 + 限制下载

**场景：** 对外演示，防截图追溯、禁止下载原文件。

```bash
caixuan share create --name "客户演示" --doc <doc-id> --json

caixuan share update <share-id> \
  --watermark both \
  --download notAllowed \
  --allow-viewer-share no \
  --file-watermark "仅供演示" \
  --watermark-color "#cccccc"

caixuan share get-link <share-id>
```

`--download` 可选：`notAllowed` | `pdf` | `pptx` | `pdfPptx`。  
`--watermark` 可选：`none` | `user` | `viewer` | `both`。

---

## 5. 向已有分享追加 / 移除文档

**场景：** 一个分享页要放多份材料，或替换其中某一份。

```bash
# 追加文档
caixuan share add-doc <share-id> <doc-id-2>

# 移除文档
caixuan share remove-doc <share-id> <doc-id-1>

# 查看当前分享内容
caixuan share get <share-id>
```

创建时也可一次挂多个文档：

```bash
caixuan share create --name "资料包" --doc <doc-a> --doc <doc-b>
```

---

## 6. 付费查看的分享

**场景：** 课程讲义、付费报告，访客需购买后才能完整查看。

```bash
caixuan share create --name "付费报告" --doc <doc-id> --json

caixuan share update <share-id> \
  --view-control buy \
  --price 9900 \
  --paid-interval '{"unit":"month","value":1}' \
  --public-buyer-and-message yes

caixuan share get-link <share-id>
```

`--price` 为最小货币单位（如分为单位时，`9900` 表示 ¥99.00）。

---

## 7. 收集访客联系方式

**场景：** 市场投放页，希望访客留下手机号 / 邮箱后再看内容。

```bash
caixuan share create --name "产品介绍" --doc <doc-id> --json

caixuan share update <share-id> \
  --view-control contact \
  --allow-leave-contact yes \
  --contact-type mobile

caixuan share get-link <share-id>
```

`--contact-type` 可选：`none` | `mobile` | `email` | `wechat`（收集手机号时用 `mobile`）。

---

## 8. 邀请同事加入空间协作

**场景：** 新同事入职，或跨部门协助维护同一批文档。

```bash
# 按手机号邀请为队友
caixuan member create --role teammate --mobile 13800138000 --name "小王"

# 或按邮箱邀请为管理员
caixuan member create --role manager --email alice@example.com

# 查看成员、调整角色
caixuan member list --table
caixuan member update <user-id> --role manager

# 移除成员
caixuan member delete <user-id>
```

角色：`manager` | `teammate` | `guest`。

---

## 9. 多空间切换（个人 / 团队）

**场景：** 同时服务多个客户或团队，需要在不同空间间切换。

```bash
caixuan space list --table
caixuan space select              # 交互选择
# 或
caixuan space select <space-id>

caixuan space current
caixuan doc list --table          # 列出当前空间文档
```

选中后的空间会写入本地配置，后续 `doc` / `share` / `member` 命令都作用于该空间。

---

## 10. 下载文档到本地备份

**场景：** 把线上最新版本拉回本地存档或二次编辑。

```bash
caixuan doc list --name 汇报 --table
caixuan doc down <doc-id> -o ./备份/季度汇报.pptx
```

---

## 11. 脚本 / CI 自动化发布

**场景：** 设计稿或构建产物生成后，自动上传并输出分享链接（适合流水线）。

```bash
#!/usr/bin/env bash
set -euo pipefail

# 建议用环境变量注入 Token，避免交互登录
export CAIXUAN_TOKEN="..."   # 或事先 caixuan config set-token

DOC_JSON=$(caixuan doc create --file ./dist/deck.pptx --name "Nightly Build" --json)
DOC_ID=$(echo "$DOC_JSON" | jq -r '.data.id')

SHARE_JSON=$(caixuan share create --name "Nightly" --doc "$DOC_ID" --json)
SHARE_ID=$(echo "$SHARE_JSON" | jq -r '.data.id')

caixuan share get-link "$SHARE_ID" --json
# 将 .data.url 写入构建产物或通知渠道
```

任意命令加 `--json` 都会输出：

```json
{ "ok": true, "data": { ... }, "meta": { ... } }
```

---

## 12. 查找、重命名与清理

**场景：** 空间里文档变多，需要按名称检索、改名或删除过期内容。

```bash
# 文档名支持子串匹配
caixuan doc list --name 草案 --table
caixuan doc update <doc-id> --name "正式版-客户确认"

# 分享名按完整名称精确匹配
caixuan share list --name "正式版-客户确认" --table
caixuan share delete <share-id>
caixuan doc delete <doc-id>
```

---

## 常用组合速查

| 目标 | 命令组合 |
|------|----------|
| 上传并分享 | `doc create` → `share create --doc` → `share get-link` |
| 加密分享 | `share create/update --view-control password --password …` |
| 限时失效 | `share update --expired-at <ISO>` |
| 防下载 / 加水印 | `share update --download notAllowed --watermark both` |
| 多文档一页 | `share add-doc` / `share create --doc … --doc …` |
| 邀请协作 | `member create --role …` |
| 自动化 | 全程加 `--json`，用 `jq` 取 `id` / `url` |
