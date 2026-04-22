# QA-006 COMP-004 前端可达性、安全头与轻量留证验证

## 目标

验证 `COMP-004` 已经完成以下三类收口：

- 学术、体育、活动等关键主路径具备键盘可达、焦点态、错误提示与非颜色状态表达
- API、Nginx 与 Web 容器补齐基础安全头与最小 CSP 基线
- 仓库内存在可重复执行的轻量留证，而不是只停留在人工口头说明

## 本轮实现

- 前端全局可达性基线：
  - `apps/web/src/styles.css`
  - `apps/web/src/ui/app-shell.tsx`
  - `apps/web/src/ui/user-experience-kit.tsx`
- 学术、体育、活动关键路径：
  - `apps/web/src/ui/pages/spaces/spaces-availability-panel.tsx`
  - `apps/web/src/ui/pages/spaces/spaces-booking-panel.tsx`
  - `apps/web/src/ui/pages/sports/sports-schedule-panel.tsx`
  - `apps/web/src/ui/pages/sports/sports-booking-panel.tsx`
  - `apps/web/src/ui/pages/activities-page.tsx`
- API 与站点安全基线：
  - `apps/api/src/bootstrap-api.ts`
  - `apps/api/src/main.ts`
  - `apps/api/test/integration-harness.ts`
  - `infra/nginx/conf.d/campusbook.conf`
  - `infra/nginx/https-conf.d/campusbook-https.conf.template`
  - `infra/docker/web-default.conf`
- 新增验证入口：
  - `apps/api/test/comp-004-security-headers.test.ts`
  - `scripts/comp-004-audit.mjs`

## 关键行为

- 全局新增 `skip link`、`focus-visible` 和 `sr-only`，主内容可直接跳转
- `StatePanel` 会按 danger / loading 等状态输出 `role` 与 `aria-live`
- 学术、体育、活动关键页补入：
  - `aria-pressed`
  - `aria-describedby`
  - 键盘操作帮助文案
  - 当前选中 / 当前目标 / 当前查看等显式文本
- API 与代理层统一返回：
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
- Web 与站点代理补入最小 CSP，默认限制为自有源并禁止被嵌入

## 验证命令

```bash
pnpm --filter web typecheck
pnpm --filter api typecheck
pnpm --filter web build
pnpm verify:comp-004
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 14:50 CST`

### 前端构建产物

```text
dist/index.html                   0.44 kB
dist/assets/index-BkMSmYs6.css   23.26 kB
dist/assets/index-vLfX63IN.js   418.55 kB
```

### 轻量审计结果

`pnpm verify:comp-004` 输出：

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
    "jsSizeBytes": 431565,
    "cssSizeBytes": 23264
  }
}
```

### 后端真实回归

`pnpm --filter api test` 结果：

```text
# tests 22
# suites 6
# pass 22
# fail 0
```

其中 `COMP-004` 对应新增用例：

- `health 接口会返回基础安全头`

## 影响

- 学术、体育、活动三条主路径现在都有可追溯的键盘与状态语义补强
- 安全头不再只存在于生产入口，测试启动与正式启动已经共用同一套 bootstrap
- `COMP-004` 已从“实现意图”转成“代码 + 构建 + 审计 + 回归”四类证据

## 下一步

- 进入 `COMP-005`
- 把现有业务测试、judge-up 和 smoke 留证继续扩到评委回归口径
