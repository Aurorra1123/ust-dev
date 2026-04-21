# 代码质量重构第二阶段学生端页面拆分验证

## 变更目标

- 按 `docs/architecture/code-quality-review-and-refactor-baseline-2026-04-21.md` 的既定顺序，先拆学生端预约页内混杂的派生逻辑、状态说明和大块 JSX。
- 保持业务行为不变，只把页面收口为“查询与状态编排”，把可独立理解的视图和规则下沉到单独模块。

## 实施摘要

- 学术空间页已完成拆分：
  - `apps/web/src/ui/pages/spaces-page.tsx` 由大页面收口为查询、路由跳转与表单状态编排
  - 新增 `apps/web/src/ui/pages/spaces/spaces-helpers.ts`
  - 新增 `apps/web/src/ui/pages/spaces/spaces-availability-panel.tsx`
  - 新增 `apps/web/src/ui/pages/spaces/spaces-booking-panel.tsx`
- 体育预约页已完成拆分：
  - `apps/web/src/ui/pages/sports-page.tsx` 由大页面收口为查询、目标切换与提交状态编排
  - 新增 `apps/web/src/ui/pages/sports/sports-helpers.ts`
  - 新增 `apps/web/src/ui/pages/sports/sports-schedule-panel.tsx`
  - 新增 `apps/web/src/ui/pages/sports/sports-booking-panel.tsx`
- 已下沉的核心职责包括：
  - 学术页时间轴 segment 构建、时间窗冲突判断、已占用/关闭区间摘要
  - 体育页 slot state 推导、组合场地 slot 聚合、状态文案与样式映射
  - 两个页面中原本堆在主文件里的大块中间面板与右侧提交面板 JSX

## 结构结果

- `spaces-page.tsx` 已从 893 行降到 305 行。
- `sports-page.tsx` 已从 781 行降到 294 行。
- 页面主文件当前只保留资源查询、页面级状态、query/mutation 编排和子组件组合。

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-DKvqEZKj.js`

## 结论

- 第二阶段中“先拆学生端大页面职责”的部分已落地，`spaces` 与 `sports` 页面不再继续承担时间规则、状态映射和大段展示细节。
- 本轮没有新增接口、兜底逻辑或猜测性兼容分支，改动边界符合 `docs/adr/0009-code-quality-refactor-boundaries.md`。
