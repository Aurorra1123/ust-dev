# QA-005 COMP-003 规则引擎 registry 与处罚闭环验证

## 目标

验证规则系统已经从固定分支升级为可扩展 registry，并把活动资格、预约次数限制和爽约处罚接入真实业务链路。

本轮覆盖 `COMP-003` 的三个核心要求：

- 规则执行不再继续堆进主流程 `switch / if-else`
- 活动报名资格、最大预约次数、爽约扣分三类规则进入真实链路
- `UserCreditLog` 与 `UserRuleProfile` 在真实处罚链路里落库

## 本轮实现

- 升级规则引擎与 handler registry：
  - `apps/api/src/modules/rules/rule-engine.ts`
  - `apps/api/src/modules/rules/rules.service.ts`
  - `apps/api/src/modules/rules/dto/create-rule.dto.ts`
  - `apps/api/src/modules/rules/dto/update-rule.dto.ts`
- 接入活动与订单链路：
  - `apps/api/src/modules/activities/activity-registration.service.ts`
  - `apps/api/src/modules/orders/orders.service.ts`
  - `apps/api/src/modules/orders/orders.module.ts`
  - `apps/api/src/modules/activities/activities.module.ts`
- 扩展共享类型与 admin 规则编辑器：
  - `packages/shared-types/src/index.ts`
  - `apps/web/src/ui/pages/admin/admin-helpers.ts`
  - `apps/web/src/ui/pages/admin/workspaces/rules-workspace.tsx`
  - `apps/web/src/ui/pages/admin/workspaces/rules/rules-workspace-helpers.ts`
  - `apps/web/src/ui/pages/admin/workspaces/rules/rules-editor-panel.tsx`
- 新增自动化验证：
  - `apps/api/test/comp-003-rules-registry-and-penalty.test.ts`

## 关键行为

- 活动抢票入口会先执行全局活动资格规则，再进入库存预扣
- 预约入口可通过新 handler `max_active_reservations_per_category` 控制用户最大有效预约数
- 爽约处罚由 `no_show_credit_penalty` handler 执行，不再由订单服务硬编码写死
- 爽约后会同步更新：
  - `User.creditScore`
  - `UserCreditLog`
  - `UserRuleProfile`
  - `UserReservationRestriction`

## 验证命令

```bash
pnpm typecheck
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 17:03 CST`

结果摘要：

```text
# tests 21
# suites 5
# pass 21
# fail 0
```

其中与 `COMP-003` 直接对应的新增用例：

- `活动报名资格规则会进入真实抢票主链路`
- `最大可预约次数规则会通过 handler registry 阻止超额预约`
- `爽约处罚规则会写入信用分日志、用户画像和禁用记录`

## 影响

- 规则系统已经具备“新增 handler + 配置接入”的扩展方式
- 活动资格、预约次数限制和爽约处罚都不再停留在文档或 schema 层
- 本轮验证过程中顺手修复了活动库存 key 初始化的竞态，`API-011` 已重新回绿
- 下一阶段继续进入 `COMP-004`
