# ADM-008 / ADM-009 管理员表单补齐与活动首屏收口验证

## 本轮目标

- `ADM-008`
  - 为体育场馆与学术空间页补齐资源与资源单元的基础 CRUD 缺口
  - 将资源页关键字段提示从 `placeholder` 升级为常驻说明
- `ADM-009`
  - 继续轻量收口活动管理页的创建表单
  - 在不改变核心票务链路的前提下强化首屏理解与字段说明

## 实现结果

### 1. 资源页基础 CRUD 补齐

- 已新增后端资源单元更新接口：
  - `PATCH /admin/resources/:resourceId/units/:unitId`
- 已新增后端 DTO：
  - `apps/api/src/modules/resource/dto/update-resource-unit.dto.ts`
- 已修改：
  - `apps/api/src/modules/resource/resource.controller.ts`
  - `apps/api/src/modules/resource/resource-write.service.ts`
  - `apps/web/src/lib/api/resource-api.ts`

结果：

- 管理员现在可以编辑资源基础信息，而不只是创建、启停和删除资源
- 管理员现在可以编辑资源单元，而不再只是新增和删除
- 本轮没有修改数据库 schema

### 2. 资源页字段说明常驻化

- 已修改：
  - `apps/web/src/ui/pages/admin/workspaces/resources-workspace.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/resources/resources-actions-panel.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/resources/resources-detail-panel.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/resources/resources-workspace-helpers.ts`
  - `apps/web/src/ui/pages/admin/admin-helpers.ts`

结果：

- 资源表单中的 `type / code / name / location / description` 已补常驻说明
- 资源单元表单中的 `code / name / unitType / availabilityMode / capacity` 已补常驻说明
- 单元卡片已支持显式选中并切到右侧编辑表单

### 3. 活动创建首屏继续收口

- 已修改：
  - `apps/web/src/ui/pages/admin/workspaces/activities-workspace.tsx`

结果：

- 新增活动首屏继续只突出：
  - 标题
  - 地点
  - 总额度
- `自定义首票` 继续保留为折叠展开
- `进阶设置` 继续保留为折叠展开
- 以下关键字段已补常驻说明：
  - 总额度
  - 售卖开始时间
  - 售卖结束时间
  - 活动开始时间
  - 活动结束时间
  - 首票价格
  - 新增票种价格

## 校验

已执行：

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api build`
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

结果：

- 六项均通过

## 结论

- `ADM-008` 已闭环：资源页已从“近似完整 CRUD”补齐为真正可编辑的基础维护页。
- `ADM-009` 已闭环：活动创建页保留原有主链路，但首屏理解成本已进一步下降。
