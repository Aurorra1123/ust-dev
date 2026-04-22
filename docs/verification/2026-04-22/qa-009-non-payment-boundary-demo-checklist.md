# QA-009 非支付边界演示清单

## 目标

整理不依赖支付链路的高收益边界场景，作为现场演示与答辩的优先脚本。

## 推荐演示顺序

1. 学术空间 `11:04` 贴脸冲突拦截
2. 学术空间 `11:10` 精确边界放行
3. 学术同房同段并发只能成功一单
4. 体育同场同 slot 并发只能成功一单
5. 体育组合预约遇到成员冲突整单失败
6. 规则停用后立即失效、启用后立即生效
7. 爽约转 `NO_SHOW` 后写入扣分、画像和限制
8. 活动库存 key 丢失后按 DB 剩余量减活跃 pending 自愈

## 场景清单

### 1. 学术 `11:04` 贴脸冲突

- 前置：
  - 使用 `unit_academic_demo`
  - 先创建 `10:00-11:00` 的学术预约
- 操作：
  - 第二个账号提交 `11:04-12:04`
- 预期：
  - 返回 `409`
  - 不生成第二张订单
- 证据来源：
  - `apps/api/test/guardrail-0.test.ts`
  - `docs/verification/2026-04-22/qa-001-guardrail-0-api-regressions.md`
- 现场话术：
  - “学术空间连续时间预约带隐形缓冲，贴脸 4 分钟仍判定冲突。”

### 2. 学术 `11:10` 精确边界

- 前置：
  - 使用 `unit_academic_demo`
  - 先创建 `10:00-11:00` 的学术预约
- 操作：
  - 第二个账号提交 `11:10-12:10`
- 预期：
  - 返回 `201`
  - 第二张订单正常创建
- 证据来源：
  - `apps/api/test/guardrail-0.test.ts`
  - `docs/verification/2026-04-22/qa-001-guardrail-0-api-regressions.md`
- 现场话术：
  - “学术空间前后各 5 分钟都参与冲突判断，所以真正的双向精确边界是 11:10。”

### 3. 学术同房同段并发

- 前置：
  - 两个学生账号同时可用
- 操作：
  - 并发提交同一个房间、同一时间段
- 预期：
  - 一单 `201`
  - 一单 `409`
- 证据来源：
  - `apps/api/test/guardrail-0.test.ts`
- 现场话术：
  - “业务层先预检，数据库层再兜底，最终只会保留一个赢家。”

### 4. 体育同场同 slot 并发

- 前置：
  - `unit_sports_demo_a`
- 操作：
  - 两个学生同时提交同一个 `slotStart`
- 预期：
  - 一单 `201`
  - 一单 `409`
- 证据来源：
  - `apps/api/test/guardrail-0.test.ts`
- 现场话术：
  - “体育设施是严格 1 小时离散 slot，不存在连续时间擦边。”

### 5. 体育组合预约成员冲突

- 前置：
  - 先把 `group_sports_demo_pair` 中某个成员场地占掉一个 slot
- 操作：
  - 再提交整组同 slot 预约
- 预期：
  - 整单失败
  - 不留下半成品 `SportsReservationSlot`
- 证据来源：
  - `apps/api/test/guardrail-0.test.ts`
- 现场话术：
  - “组合资源是整组事务，不允许半成功。”

### 6. 规则停用与启用即时生效

- 前置：
  - 创建一条 `min_credit_score` 规则并绑定学术资源
- 操作：
  - 先验证命中拦截
  - 再停用规则后重试
  - 再启用规则后重试
- 预期：
  - 停用后立刻放行
  - 启用后立刻恢复拦截
- 证据来源：
  - `apps/api/test/comp-005-business-regressions.test.ts`
  - `docs/verification/2026-04-22/qa-007-comp-005-real-business-testing-and-judge-evidence.md`
- 现场话术：
  - “规则不是写死在业务主流程里的 if-else，启停可即时生效。”

### 7. 爽约处罚真实落库

- 前置：
  - 创建 `no_show_credit_penalty` 规则并绑定学术资源
- 操作：
  - 提交学术预约
  - 触发 `finalizeReservationAttendance`
- 预期：
  - 订单转 `NO_SHOW`
  - `User.creditScore` 扣减
  - 写入 `UserCreditLog`
  - 写入 `UserRuleProfile`
  - 写入 `UserReservationRestriction`
- 证据来源：
  - `apps/api/test/comp-003-rules-registry-and-penalty.test.ts`
  - `docs/verification/2026-04-22/qa-005-comp-003-rules-registry-and-penalty.md`
- 现场话术：
  - “处罚不是文档口径，已经落到真实画像和限制记录。”

### 8. 活动库存恢复自愈

- 前置：
  - 创建一个库存为 `1` 或 `2` 的活动票
  - 在 Redis 中制造 remaining key 丢失或 pending 过期
- 操作：
  - 触发恢复逻辑
- 预期：
  - remaining key 按 “DB 剩余量 - 活跃 pending” 重建
  - 不把活跃占位错误放掉
- 证据来源：
  - `apps/api/test/comp-006-activity-inventory-recovery.test.ts`
  - `docs/verification/2026-04-22/qa-004-comp-006-activity-inventory-recovery.md`
- 现场话术：
  - “缓存不是单点真相，丢 key 后能从 DB 与活跃占位恢复。”

## 使用建议

- 时间紧张时优先演示 `1 / 2 / 5 / 7`
- 若评委偏工程实现，可切到 `3 / 4 / 8`
- 若评委追问规则系统，再联动查看 `rules-engine-answer-sheet-2026-04-22.md`
