# QA-011 API Test Harness Stability Repair

## 结论

`apps/api` 的测试长时间卡住，主因不是业务断言本身，而是测试夹具初始化路径存在自锁死与重复初始化。

本轮已将测试夹具修复为可稳定完成，且已完成 `pnpm --filter api test` 全量验证。

## 根因

1. `apps/api/test/integration-harness.ts` 的 `resetFixture()` 在持有 PostgreSQL advisory lock 时调用 `pnpm --filter api seed:demo`
2. `apps/api/src/scripts/seed-demo-data.ts` 内部又会申请同一把 advisory lock
3. 父进程等待子进程结束，子进程等待父进程释放锁，形成自锁死
4. `createIntegrationHarness()` 每个 suite 都重复执行 `prisma:migrate:deploy`
5. 已有 `beforeEach(resetFixture)` 的 suite 还会额外做一次多余初始化
6. 若仅等待 `waitForActivityQueueIdle()`，并不能保证报名状态和订单详情已经稳定可查

## 修复

- `resetFixture()` 改为只负责等待活动队列清空后执行统一 `seed:demo`
- 移除夹具中与 `seed:demo` 重复的 truncate/flush/outer advisory lock
- `prisma:migrate:deploy` 改为单次测试进程内只执行一次
- `createIntegrationHarness()` 新增 `initializeFixture` 选项，供带 `beforeEach(resetFixture)` 的 suite 跳过首次多余初始化
- 新增 `waitForRegistrationStatus()`，用于等待活动报名状态真正进入目标状态

## 验证

已执行：

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`

结果：

- `25 tests`
- `7 suites`
- `25 pass`
- `0 fail`

## 已通过 Suite

- `COMP-001 paid activity payment path`
- `COMP-002 ghost payment race`
- `COMP-003 rules registry and penalty chain`
- `COMP-004 security headers`
- `COMP-005 business regressions`
- `COMP-006 activity inventory consistency and recovery`
- `Guardrail-0 API regressions`
