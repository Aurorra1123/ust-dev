# QA-001 Guardrail-0 API 回归验证

## 目标

为比赛整改前的现有强项补一组保护性回归，避免后续支付、库存和规则改造破坏学术空间、体育预约和活动抢票的已命中行为。

本轮覆盖主计划中 `Guardrail-0` 的首批 `8` 条 API 用例：

- `API-001`
- `API-002`
- `API-004`
- `API-007`
- `API-008`
- `API-009`
- `API-010`
- `API-011`

## 本轮实现

- 新增 `apps/api/test/guardrail-0.test.ts`
- 新增 `apps/api/test/integration-harness.ts`
- 新增 `apps/api/tsconfig.test.json`
- 为 `apps/api/package.json` 增加真实测试入口，`pnpm test` 不再空跑
- CI 新增 `postgres` 与 `redis` service，允许 Guardrail 集成测试在流水线里跑

## 关键修正

- 本轮把学术预约缓冲语义统一为前后各 `5` 分钟：
  - 当前实现收口为“双向 `5` 分钟隐形缓冲”，因此精确放行边界从旧口径的 `11:05` 更新为 `11:10`
- 修复体育 slot 并发冲突未映射成 `409` 的问题：
  - 现在数据库唯一键冲突会稳定转成 `sports-reservation-conflict`
- 修复活动抢票首次并发触发 Redis 首连竞争时返回 `500` 的问题：
  - `RedisService.connect()` 现在会等待连接真正 `ready`
- 修复 BullMQ / Redis 连接在关闭阶段的脏退出问题：
  - 补了统一的 Redis 安全关闭逻辑

## 验证命令

```bash
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 13:55 CST`

结果摘要：

```text
# tests 8
# suites 1
# pass 8
# fail 0
```

覆盖结论：

- 学术空间：
  - 贴脸冲突会被拒绝
  - `11:10` 精确边界可以放行
  - 同房同段并发只有一个赢家
- 体育预约：
  - 同场同 slot 并发只有一个赢家
  - 组合预约遇到成员冲突时整单失败且不留半成品
  - 单场与组合资源对撞时只保留一个赢家
- 活动抢票：
  - 同用户并发抢同票只保留一条有效报名
  - 超库存高并发场景下不超卖

## 影响

- `Guardrail-0` 已经从计划项转为真实自动化门槛
- 后续进入 `COMP-001`、`COMP-002`、`COMP-006` 时，学术、体育、活动当前已命中的基础行为已有保护性回归
