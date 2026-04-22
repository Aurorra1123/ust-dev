# QA-003 COMP-002 幽灵支付对撞与补偿闭环验证

## 目标

验证支付回调与超时取消在同一条付费活动票主链路上不会产生脏写，并留下明确补偿证据。

本轮覆盖 `COMP-002` 的三个核心要求：

- `transactionNo` 唯一且 callback 幂等
- 超时取消与支付确认都基于订单 `status + version` 做 CAS
- 最后一秒支付与同时过期取消对撞时只有一个最终赢家，迟到 callback 会被拒绝并写入补偿日志

## 本轮实现

- 新增 `PaymentCompensationLog` 与 `PaymentCompensationType`
- 新增 Prisma migration：
  - `apps/api/prisma/migrations/20260422150000_payment_compensation_logs/migration.sql`
- 扩展订单状态机：
  - `apps/api/src/modules/orders/orders.service.ts`
- 改造支付 callback：
  - `apps/api/src/modules/payment/payment.service.ts`
- 调整测试基建，强制 `node:test` 串行执行，避免多套测试应用并发拉起：
  - `apps/api/package.json`
  - `apps/api/test/integration-harness.ts`
- 新增自动化验证：
  - `apps/api/test/comp-002-ghost-payment-race.test.ts`

## 关键行为

- 支付 callback 通过订单状态迁移入口完成确认，不再先把支付记录改成 `PAID` 再补确认订单
- 订单离开 `PENDING_CONFIRMATION` 时会清空 `expireAt`
- 过期取消会把待支付 `PaymentRecord` 从 `PENDING` 改为 `FAILED`
- 迟到 callback 不会把已取消订单改回确认态，而是写入 `PaymentCompensationLog(LATE_CALLBACK_REJECTED)`
- 过期 worker 在遇到确认竞争时会平稳跳过，不再把正常竞争记成失败任务

## 验证命令

```bash
pnpm --filter api prisma:generate
pnpm --filter api typecheck
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 15:20 CST`

结果摘要：

```text
# tests 13
# suites 3
# pass 13
# fail 0
```

其中与 `COMP-002` 直接对应的新增用例：

- `重复 callback 应保持幂等，不会重复确认订单`
- `订单过期取消后，迟到 callback 会被拒绝并写入补偿日志`
- `最后一秒支付与同时过期取消对撞时只有一个最终赢家`

## 影响

- 订单确认与超时取消已经进入同一套 CAS 竞争规则
- 迟到支付不会再把已取消订单错误改回 `CONFIRMED`
- 幽灵支付从“有骨架”推进到“有真实对撞验证和补偿留痕”
- 本轮仍未处理活动库存自愈与 `totalQuota`，下一阶段继续进入 `COMP-006`
