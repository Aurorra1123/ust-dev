# QA-004 COMP-006 活动库存一致性与恢复验证

## 目标

验证活动库存从“Redis 预扣骨架”提升为“带总额度约束、归属校验和冷恢复”的可验证闭环。

本轮覆盖 `COMP-006` 的三个核心要求：

- `totalQuota == sum(ticket.stock)` 被强校验并保持一致
- Redis pending 占位与补偿具备 ticket / job 归属校验
- Redis key 丢失或 pending 过期后，库存可按数据库剩余量与活跃 pending 自愈

## 本轮实现

- 强化活动额度校验：
  - `apps/api/src/modules/activities/activities.service.ts`
  - `apps/api/src/modules/activities/dto/create-activity.dto.ts`
  - `apps/api/src/modules/activities/dto/update-activity.dto.ts`
- 重写库存缓存占位值与补偿校验：
  - `apps/api/src/modules/activities/activity-registration.constants.ts`
  - `apps/api/src/modules/activities/activity-inventory-cache.service.ts`
  - `apps/api/src/modules/activities/activity-registration.service.ts`
- 新增库存恢复服务与 worker 定时重建：
  - `apps/api/src/modules/activities/activity-inventory-recovery.service.ts`
  - `apps/api/src/modules/activities/activity-inventory-recovery-worker.service.ts`
  - `apps/api/src/modules/activities/activities.module.ts`
  - `apps/api/src/worker.module.ts`
- 扩展测试基建，允许测试直接取到 worker 侧服务：
  - `apps/api/test/integration-harness.ts`
- 新增自动化验证：
  - `apps/api/test/comp-006-activity-inventory-recovery.test.ts`

## 关键行为

- 创建或更新活动时，`totalQuota` 必须严格等于票种 `stock` 总和
- 新增票种后，活动 `totalQuota` 会自动同步为最新票种库存总和
- pending value 改为携带 `jobId + ticketId`，补偿与完成动作都按归属校验
- Redis `remaining` key 丢失时，系统会按“数据库剩余量 - 活跃 pending 数”重建库存
- pending 过期或 worker 中断后，恢复服务会把库存自动修回数据库剩余量，避免长期假售罄

## 验证命令

```bash
pnpm --filter api typecheck
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 16:03 CST`

结果摘要：

```text
# tests 18
# suites 4
# pass 18
# fail 0
```

其中与 `COMP-006` 直接对应的新增用例：

- `创建活动时 totalQuota 必须严格等于票种 stock 之和`
- `新增票种后 totalQuota 会自动同步为所有票种 stock 总和，手工改错会被拒绝`
- `库存 key 丢失后会按 DB 剩余量减去活跃 pending 数重建，不会把活跃占位丢掉`
- `无主补偿会被跳过，不能把别的票种库存错误加回去`
- `pending 过期后可通过恢复服务自愈回 DB 剩余量`

## 影响

- 活动库存不再只依赖单次 `DECR/INCR`，而是具备恢复与归属校验
- `totalQuota` 不再是可漂移字段，而是与票种库存总和保持严格一致
- 本轮没有改动支付、规则或前端模块；下一阶段继续进入 `COMP-003`
