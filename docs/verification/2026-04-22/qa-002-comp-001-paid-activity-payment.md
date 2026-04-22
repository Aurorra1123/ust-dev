# QA-002 COMP-001 付费活动票待支付主链路验证

## 目标

把付费活动票从“创建即确认”改成真实 `PENDING_CONFIRMATION` 主链路，并补齐最小可演示的 mock 支付闭环。

本轮围绕统一样例“红鸟音乐节 5 元普通票”验证以下要求：

- 抢到付费票后创建 `PENDING_CONFIRMATION` 订单
- 订单创建时写入 `expireAt`
- 同步写入 `PaymentRecord(PENDING)`
- mock 支付回调后订单进入 `CONFIRMED`
- 免费票继续保持现有直接确认路径

## 本轮实现

- 新增 `apps/api/src/modules/payment/payment.module.ts`
- 新增 `apps/api/src/modules/payment/payment.controller.ts`
- 新增 `apps/api/src/modules/payment/payment.service.ts`
- 新增 `apps/api/src/modules/payment/dto/mock-payment-callback.dto.ts`
- 改造 `apps/api/src/modules/activities/activity-registration.service.ts`
- 扩展 `apps/api/src/modules/orders/orders.service.ts`
- 更新前端订单详情页与订单 API：
  - `apps/web/src/lib/api/order-api.ts`
  - `apps/web/src/ui/pages/order-detail-page.tsx`
- 扩展共享类型：
  - `packages/shared-types/src/index.ts`
- 新增后端自动化验证：
  - `apps/api/test/comp-001-paid-activity-payment.test.ts`

## 关键行为

- `priceCents > 0` 的活动票创建后，订单初始状态改为 `PENDING_CONFIRMATION`
- 付费订单会写入 `expireAt` 并登记到订单过期队列
- 付费订单会同步创建 `PaymentRecord(PENDING)`
- 订单详情页可展示支付状态、金额、交易号和剩余支付时间
- mock 支付入口会为订单生成固定 `transactionNo`，回调后把订单确认并把支付记录改为 `PAID`
- 免费活动票继续沿用直接确认，不进入支付态

## 验证命令

```bash
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 14:42 CST`

结果摘要：

```text
# tests 10
# suites 2
# pass 10
# fail 0
```

其中与 `COMP-001` 直接对应的新增用例：

- `付费活动票应创建为 pending_confirmation 并写入 PaymentRecord(PENDING)`
- `mock payment callback 后订单应转为 confirmed 且支付记录转为 paid`

## 影响

- 付费活动票已经进入真实待支付主链路，不再在创建时直接确认
- 订单系统已经能向前端暴露支付记录与待支付截止时间
- 后续 `COMP-002` 可以直接在这条链路上补幽灵支付 CAS、幂等和补偿闭环，而不必再从零搭主路径
- 本轮尚未处理“最后一秒支付 vs 超时取消”的并发补偿，这部分继续留给 `COMP-002`
