# ADM-005 ~ ADM-007 管理员首页与规则中心收口验证

## 本轮目标

- `ADM-005`：将管理员运营总揽收口为轻量入口页，只保留 5 个主入口卡片与 3 个待处理数字卡。
- `ADM-006`：恢复独立的规则配置一级栏目，并把规则相关控制从体育场馆与学术空间页面中剥离出来。
- `ADM-007`：将规则配置页按学术空间与体育场馆拆成两个域内子页，并移除旧的三栏式规则控制台概览区。

## 实现结果

### 1. 运营总揽轻量化

- 已修改 `apps/web/src/ui/pages/admin/workspaces/overview-workspace.tsx`
- 当前首页只保留：
  - 一行标题
  - 一句说明
  - 5 个主入口卡片
  - 3 个待处理数字卡
- 已删除：
  - 统计总览卡
  - 结构说明块
  - 步骤说明块
  - 对象快照块

### 2. 恢复规则配置一级栏目

- 已修改 `apps/web/src/ui/pages/admin/admin-helpers.ts`
- 已修改 `apps/web/src/ui/pages/admin/index.tsx`
- 管理员一级导航现已恢复 `规则配置`
- `体育场馆` 与 `学术空间` 页面继续保留，但内部不再显式提供：
  - 预约关闭规则
  - 开放策略 / 高级调度
  - 批量作用资源
  - 资源预约状态查询
  - 管理员取消预约入口

### 3. 资源页职责收口

- 已修改：
  - `apps/web/src/ui/pages/admin/workspaces/resources-workspace.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/resources/resources-catalog-panel.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/resources/resources-detail-panel.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/resources/resources-actions-panel.tsx`
- 当前资源页只保留：
  - 资源列表
  - 资源创建
  - 资源启停 / 删除
  - 资源单元创建 / 删除
  - 学术空间区域切换

### 4. 规则页分域与两栏化

- 已修改：
  - `apps/web/src/ui/pages/admin/workspaces/rules-workspace.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/rules/rules-editor-panel.tsx`
- 当前规则配置页内部已存在：
  - `学术空间规则`
  - `体育场馆规则`
- 每个子页的资源绑定只显示当前业务域资源，不再出现体育与学术混排
- 旧的第三列概览面板已移除，页面结构收口为：
  - 左侧规则列表
  - 右侧规则编辑器

## 校验

已执行：

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

结果：

- 三项均通过

## 结论

- `ADM-005` 已闭环：运营总揽已从重内容首页收口为轻量入口页。
- `ADM-006` 已闭环：规则配置重新获得独立一级入口，资源页不再混入规则/调度控制。
- `ADM-007` 已闭环：规则页已按学术 / 体育分域，并从三栏结构收口为两栏操作页。
