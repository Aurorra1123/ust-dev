# QA-017 Cyclomatic Final AST Report

## 本轮范围

本轮按计划完成三批复杂度治理：

- 第一批：前端高复杂度页面与工作台
- 第二批：预约面板拆分
- 第三批：后端核心服务函数拆分

## 计划内热点结果

已明显下降的计划内热点：

- `ResourcesWorkspace`
- `OrderDetailPage`
- `ActivitiesWorkspace`
- `ActivitiesPage`
- `RulesEditorPanel`
- `SpacesBookingPanel`
- `SportsBookingPanel`
- `ReservationService.createSportsReservation`
- `OrdersService.transitionOrder`
- `normalizeActivityTimeline`

说明：

- 这些函数或组件已不再处于当前 AST 复查的 `>20` 热点列表中
- 资源工作台额外做了一轮收口，把大 action hook 拆成 view / panel / mutation 三个 hook

## 当前 AST 汇总

最终扫描结果：

- `analyzedFiles`: `162`
- `analyzedFunctions`: `1278`
- `over10`: `36`
- `over15`: `15`
- `over20`: `5`
- `over30`: `1`

当前前 5 个 `>20` 热点：

1. `apps/web/src/ui/pages/admin/workspaces/rules-workspace.tsx` `RulesWorkspace` `38`
2. `apps/web/src/ui/pages/spaces-page.tsx` `SpacesPage` `28`
3. `apps/web/src/ui/pages/sports-page.tsx` `SportsPage` `27`
4. `apps/web/src/ui/pages/admin/workspaces/notifications-workspace.tsx` `NotificationsWorkspace` `24`
5. `apps/api/src/modules/orders/orders.service.ts` `toOrderDetail` `21`

## 结果判断

- 本轮计划内热点已经完成
- 当前剩余 `>20` 热点已经转移到未纳入本轮计划的页面容器和读侧拼装函数
- 如果继续做下一轮，优先顺序应为：
  - `RulesWorkspace`
  - `SpacesPage`
  - `SportsPage`
  - `NotificationsWorkspace`
  - `toOrderDetail`

## 本轮最终验证

已执行并通过：

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
```

其中 `apps/api` 全量测试结果：

- `26 tests`
- `7 suites`
- `0 fail`
