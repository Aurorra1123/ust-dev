# 代码质量重构第三阶段后台工作区拆分验证

## 变更目标

- 继续按代码质量基线既定顺序，拆分后台 `resources-workspace.tsx` 与 `rules-workspace.tsx` 中混杂的表单状态、规则格式化、确认交互和大块 JSX。
- 保持现有后台行为与接口不变，只把工作区主文件收口为 query / mutation / 页面级联动编排。

## 实施摘要

- 资源工作区已完成拆分：
  - `apps/web/src/ui/pages/admin/workspaces/resources-workspace.tsx` 现在只保留查询、mutation、窗口确认与页面级状态联动
  - 新增 `apps/web/src/ui/pages/admin/workspaces/resources/resources-workspace-helpers.ts`
  - 新增 `apps/web/src/ui/pages/admin/workspaces/resources/resources-catalog-panel.tsx`
  - 新增 `apps/web/src/ui/pages/admin/workspaces/resources/resources-detail-panel.tsx`
  - 新增 `apps/web/src/ui/pages/admin/workspaces/resources/resources-actions-panel.tsx`
- 规则工作区已完成拆分：
  - `apps/web/src/ui/pages/admin/workspaces/rules-workspace.tsx` 现在只保留查询、mutation、编辑状态联动与提交编排
  - 新增 `apps/web/src/ui/pages/admin/workspaces/rules/rules-workspace-helpers.ts`
  - 新增 `apps/web/src/ui/pages/admin/workspaces/rules/rules-selector-panel.tsx`
  - 新增 `apps/web/src/ui/pages/admin/workspaces/rules/rules-editor-panel.tsx`
  - 新增 `apps/web/src/ui/pages/admin/workspaces/rules/rules-summary-panel.tsx`
- 已下沉的核心职责包括：
  - 资源工作区默认表单状态、资源 mutation 错误映射、资源列表展示、当前资源详情、批量目标区和右侧操作表单
  - 规则工作区默认编辑状态、规则表达式构造、规则摘要文案、规则选择区、编辑与绑定区、概览说明区

## 结构结果

- `resources-workspace.tsx` 已从 1335 行降到 448 行。
- `rules-workspace.tsx` 已从 701 行降到 262 行。
- 两个主工作区文件当前都只承担“数据编排 + 页面级交互边界”，不再继续堆放格式化函数和大段 UI。

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-BpDAZ690.js`

## 结论

- 第三阶段中“先拆后台大工作区职责”的部分已落地，后台资源与规则工作区的主文件边界已经清晰收窄。
- 本轮没有新增接口、后端 DTO 或前端兜底分支，改动范围仍然符合 `docs/adr/0009-code-quality-refactor-boundaries.md`。
