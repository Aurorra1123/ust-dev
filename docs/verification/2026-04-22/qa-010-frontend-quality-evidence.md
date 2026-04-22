# QA-010 前端质量留证补充

## 目标

补一份非支付方向的前端质量留证，回答以下问题：

- 当前前端无障碍基线有哪些真实证据
- 本轮首屏减重是否真的落地
- 安全头和轻量源码审计是否仍保持通过

## 验证命令

```bash
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter api typecheck
pnpm --filter web test:quality
```

## 验证结果

执行时间：`2026-04-22`

### 1. 前端构建与类型检查

```text
web typecheck: pass
web build: pass
api typecheck: pass
```

### 2. 路由分包结果

本轮构建已出现独立页面 chunk：

```text
dist/assets/orders-page-*.js               2.68 kB
dist/assets/service-requests-page-*.js     4.63 kB
dist/assets/order-detail-page-*.js         5.95 kB
dist/assets/activities-page-*.js           7.54 kB
dist/assets/sports-page-*.js              17.02 kB
dist/assets/spaces-page-*.js              18.37 kB
dist/assets/admin-page-*.js               79.33 kB
dist/assets/index-*.js                   276.80 kB
```

结论：

- 学生端和管理员主路径已不再全部堆进首包
- `admin` 作为最重页面已经独立拆出

### 3. 源码审计结果

`pnpm --filter web test:quality` 输出：

```json
{
  "status": "ok",
  "sourceChecks": [
    { "id": "a11y-global-focus", "ok": true },
    { "id": "a11y-skip-link", "ok": true },
    { "id": "a11y-state-panel-live-region", "ok": true },
    { "id": "a11y-spaces-keyboard-help", "ok": true },
    { "id": "a11y-sports-keyboard-help", "ok": true },
    { "id": "a11y-activities-explicit-status", "ok": true },
    { "id": "security-web-proxy-headers", "ok": true },
    { "id": "security-web-container-headers", "ok": true },
    { "id": "security-api-baseline-headers", "ok": true }
  ],
  "buildArtifacts": {
    "htmlSizeBytes": 437,
    "jsSizeBytes": 277917,
    "cssSizeBytes": 23595
  }
}
```

## 本轮新增提分点

- 工单页补齐显式 `label`
- 问题说明补充 `aria-describedby`
- 路由级统一 loading fallback
- 学生与管理员页面做最小懒加载拆分

## 当前仍未覆盖的证据

- 还没有 Lighthouse 实测截图
- 还没有移动端截图留证
- 还没有人工键盘走查录屏

## 结论

本轮已经把“源码层可访问性和安全基线”以及“构建产物层路由分包”落成了真实证据，但若想继续冲前端质量分，下一步仍应补 Lighthouse 与移动端实测截图。
