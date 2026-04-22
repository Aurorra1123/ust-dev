# ADR 0022: 活动库存缓存按“数据库剩余量 - 活跃 pending 数”重建

## 状态

已采纳，实施于 `COMP-006`。

## 背景

活动抢票当前使用 Redis `remaining` key 做热点削峰，但比赛缺口里有两类问题没有被收口：

- Redis `remaining` key 丢失后，单靠数据库 `stock - reserved` 重建会忽略仍在排队或处理中但尚未落库的 pending 请求
- worker 中断或 pending key 过期后，Redis 可能长期残留偏小库存，形成“假售罄”

如果不解决这两件事，系统无法稳定回答“Redis key 丢失或 worker 中断后会怎样”。

## 决策

库存缓存不再把 Redis 中的 `remaining` 当作唯一真相，而是按下面规则重建：

1. 数据库真相仍然是 `ActivityTicket.stock - ActivityTicket.reserved`
2. Redis 中仍活着的 pending 占位代表“尚未落库但已经占用的临时库存”
3. 当库存 key 缺失或执行周期性修复时，系统把缓存重算为：

`remaining = max((stock - reserved) - livePendingCount, 0)`

其中 `livePendingCount` 只统计当前 activity 下、pending value 归属到该 ticket 的活跃占位。

## 衍生规则

- pending value 必须携带 `jobId + ticketId`，补偿和完成操作都做归属校验
- 无主补偿直接跳过，不允许把别的票种库存错误加回去
- worker 周期性执行库存重建，用于修复 key 丢失、pending 过期后遗留的“假售罄”

## 理由

- 这是当前最小必要的自愈闭环，不需要新增持久化 pending 表
- 既避免 key 丢失时忽略活跃占位，也能在 pending 自然消失后把库存自动修回数据库剩余量
- “归属校验 + 周期重建”比继续依赖单次 `INCR/DECR` 更适合答辩与排障

## 影响

- `totalQuota`、数据库 `reserved`、Redis `remaining` 的职责边界更清晰
- 活动库存缓存从“可能永久漂移”变成“可恢复、可解释、可验证”
- 当前仍未引入持久化 pending claim 表；如果后续接入更复杂的跨服务支付或分布式 worker，再评估是否需要升级
