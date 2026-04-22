# QA-014 Frontend Cyclomatic Batch 1 Refactor

## 范围

本轮完成圈复杂度治理第一批，目标是拆分前端高复杂度页面与工作台组件，不改变业务接口与用户路径。

涉及入口：

- `apps/web/src/ui/pages/order-detail-page.tsx`
- `apps/web/src/ui/pages/activities-page.tsx`
- `apps/web/src/ui/pages/admin/workspaces/activities-workspace.tsx`
- `apps/web/src/ui/pages/admin/workspaces/resources-workspace.tsx`
- `apps/web/src/ui/pages/admin/workspaces/resources/resources-catalog-panel.tsx`
- `apps/web/src/ui/pages/admin/workspaces/rules/rules-editor-panel.tsx`

## 主要拆分

- 订单详情页：
  - 拆出状态视图、主操作区、信息网格、支付面板
  - 订单标签和支付剩余时间收口到 `order-utils.tsx`
- 活动学生页：
  - 拆出活动列表侧栏、活动概览、票种区、报名状态区
  - 页面只保留查询和 mutation 编排
- 活动管理工作台：
  - 拆出活动列表、当前活动摘要、新建活动表单、加票表单、状态切换
  - 表单默认值、payload 构造和校验下沉到 `activities-workspace-helpers.ts`
- 资源工作台：
  - 拆出 workspace selectors、mutation hook、action hook、学术区域 tabs
  - 页面主组件只保留查询、状态编排和渲染装配
- 资源目录面板：
  - 将超长 `resources.map` 回调拆成 `ResourceCatalogCard / ResourceUnitsSection / ResourceUnitCard`
- 规则编辑器：
  - 按规则类型拆成字段组件，替换内联分支块

## 验证

已执行：

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
```

结果：

- `lint` 通过
- `typecheck` 通过
- `build` 通过
- 构建输出仍保持路由分包

## 影响判断

- 本轮只做前端组件拆分与 selector/hook 抽离
- 没有改动 API 接口、数据库 schema、状态机或权限边界
- 后续第二批继续处理预约面板，第三批处理后端服务函数
