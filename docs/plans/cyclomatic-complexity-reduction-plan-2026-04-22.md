# Cyclomatic Complexity Reduction Plan

日期：`2026-04-22`

## 目标

围绕当前 AST 扫描得到的高复杂度热点，执行一轮以“最小行为变化、最大结构收口”为原则的复杂度治理。

本轮目标：

- 清零前端 `>20` 的高复杂度组件
- 将 `>15` 的高复杂度函数数量显著压缩
- 在不改业务语义的前提下，把复杂度从页面级和服务级主函数下沉到 selector、helper、子组件与私有方法

## 当前热点

### 前端

- `ResourcesWorkspace`
- `OrderDetailPage`
- `ActivitiesWorkspace`
- `ActivitiesPage`
- `RulesEditorPanel`
- `SpacesBookingPanel`
- `SportsBookingPanel`

### 后端

- `ReservationService.createSportsReservation`
- `OrdersService.transitionOrder`
- `normalizeActivityTimeline`

## 批次安排

### 第一批：前端高收益拆分

1. `apps/web/src/ui/pages/admin/workspaces/resources-workspace.tsx`
2. `apps/web/src/ui/pages/order-detail-page.tsx`
3. `apps/web/src/ui/pages/admin/workspaces/activities-workspace.tsx`
4. `apps/web/src/ui/pages/activities-page.tsx`
5. `apps/web/src/ui/pages/admin/workspaces/rules/rules-editor-panel.tsx`

验收：

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

### 第二批：预约面板拆分

1. `apps/web/src/ui/pages/spaces/spaces-booking-panel.tsx`
2. `apps/web/src/ui/pages/sports/sports-booking-panel.tsx`

验收：

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

### 第三批：后端服务函数拆分

1. `apps/api/src/modules/reservation/reservation.service.ts`
2. `apps/api/src/modules/orders/orders.service.ts`
3. `apps/api/src/modules/activities/activities.service.ts`

验收：

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- 按模块补最小回归验证

## 第一批实施细项

### ResourcesWorkspace

新增：

- `resources/resources-workspace-selectors.ts`
- `resources/use-resource-workspace-mutations.ts`
- `resources/resource-inline-panel-host.tsx`
- `resources/resource-workspace-feedback.tsx`
- `resources/academic-area-tabs.tsx`

拆出：

- 资源筛选与活跃对象 selector
- 资源与资源单元表单校验
- 资源 mutation hook
- 顶部学术分区 tabs
- 行内面板承载组件
- mutation 反馈组件

### OrderDetailPage

新增：

- `order-detail-state-view.tsx`
- `order-primary-actions.tsx`
- `order-info-grid.tsx`
- `order-payment-panel.tsx`
- `order-timeline-panel.tsx`

补充 `order-utils.tsx`：

- `getLatestPayment`
- `shouldShowPaymentPanel`
- `getOrderPrimaryActions`
- `getOrderInfoCards`

### ActivitiesWorkspace

新增：

- `admin/workspaces/activities/activity-list-panel.tsx`
- `admin/workspaces/activities/selected-activity-summary.tsx`
- `admin/workspaces/activities/create-activity-panel.tsx`
- `admin/workspaces/activities/create-ticket-panel.tsx`
- `admin/workspaces/activities/activity-status-actions.tsx`
- `admin/workspaces/activities/activities-workspace-helpers.ts`

### ActivitiesPage

新增：

- `activities/activity-list-sidebar.tsx`
- `activities/activity-overview-card.tsx`
- `activities/activity-tickets-panel.tsx`
- `activities/activity-ticket-card.tsx`
- `activities/activity-registration-status-panel.tsx`
- `activities/activities-page-selectors.ts`

### RulesEditorPanel

新增：

- `admin/workspaces/rules/rule-type-fields.tsx`
- `admin/workspaces/rules/max-duration-fields.tsx`
- `admin/workspaces/rules/min-credit-score-fields.tsx`
- `admin/workspaces/rules/allowed-roles-fields.tsx`
- `admin/workspaces/rules/max-active-reservations-fields.tsx`
- `admin/workspaces/rules/no-show-penalty-fields.tsx`

## 第二批实施细项

### SpacesBookingPanel

新增：

- `spaces/space-time-range-fields.tsx`
- `spaces/space-validation-panel.tsx`
- `spaces/occupied-periods-card.tsx`
- `spaces/resource-closures-card.tsx`
- `shared/companion-emails-field.tsx`

### SportsBookingPanel

新增：

- `sports/sports-booking-mode-switch.tsx`
- `sports/sports-target-select.tsx`
- `sports/grouped-booking-notice.tsx`
- `sports/selected-slots-card.tsx`
- 复用 `shared/companion-emails-field.tsx`

## 第三批实施细项

### ReservationService.createSportsReservation

拆出私有方法：

- `resolveSportsReservationTarget`
- `assertSportsReservationTarget`
- `assertSportsReservationUnits`
- `assertSportsReservationRules`
- `findSportsReservationConflict`
- `createSportsReservationOrder`
- `buildSportsReservationResponse`

### OrdersService.transitionOrder

拆出私有方法：

- `loadOrderForTransition`
- `assertTransitionActor`
- `assertTransitionAllowed`
- `runOrderTransitionTransaction`
- `syncOrderChildrenStatus`

### normalizeActivityTimeline

拆出纯函数：

- `parseOptionalDate`
- `parseNullableDate`
- `assertValidActivityDate`
- `assertSaleTimeline`
- `assertEventTimeline`

## 完成标准

- 主要热点函数复杂度明显下降
- 前端与后端校验全部通过
- 重新生成 AST 复杂度报告
- 更新 `docs/progress/agent-progress.md`
- 每完成一个阶段即提交一次 git
