# 代码质量重构第五阶段 HTTP fallback 清理验证

## 变更目标

- 清理 `apps/web/src/lib/http/client.ts` 中对未知 hostname 的猜测性 API base URL fallback。
- 保留已确认的正式站点和本地开发默认路径，但对未知运行环境改为显式报配置缺失，而不是偷偷请求生产 API。

## 实施摘要

- 已调整 `getApiBaseUrl` 解析顺序：
  - 先读取运行时 `config.js` 中的 `apiBaseUrl`
  - 再读取 `VITE_API_BASE_URL`
  - 最后只对两类已确认场景做默认推导：
    - `campusbook.top / www.campusbook.top` -> 跟随当前协议推导 `api.campusbook.top`
    - `localhost / 127.0.0.1 / 直接 IP` -> `/api`
- 已移除旧逻辑中的问题分支：
  - 未知 hostname 不再默认猜成 `api.campusbook.top`
  - 无浏览器上下文时也不再静默落到生产 API 域名
- 当前若运行时与环境变量都未配置，且 hostname 又不属于已确认场景，前端会显式抛出 `api-base-url-not-configured`
- 已同步更新长期规则：
  - `docs/standards/deployment-baseline.md`

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-BakTXs3H.js`

## 结论

- 第五阶段中“停止未知环境下的猜测性 HTTP fallback”已落地，前端请求层现在只在已确认场景下提供默认值。
- 这次改动没有影响正式域名与本地开发路径，但阻止了其他 host 被悄悄导向生产 API，符合 `docs/adr/0009-code-quality-refactor-boundaries.md` 的边界要求。
