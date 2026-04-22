# ADR 0023: 规则引擎升级为强类型 handler registry

## 状态

已采纳，实施于 `COMP-003`。

## 背景

当前规则系统只有三个固定 `ruleType`，执行逻辑集中在一个 `switch` 里：

- 新增规则必须继续改核心分支
- 活动报名资格没有进入真实链路
- 爽约处罚仍然是订单服务里的硬编码逻辑
- `UserCreditLog` 与 `UserRuleProfile` 没有真正进入业务主链

这已经不适合比赛后续的规则扩展和答辩说明。

## 决策

规则引擎改为强类型 `handler registry`，不引入 DSL 或脚本执行平台。

当前 registry 按 `ruleType` 注册 handler，每个 handler 负责：

1. 校验并规范化 `expression`
2. 声明自己支持的评估 scope
3. 在需要时执行副作用，例如爽约处罚

本阶段新增并落地的真实规则类型包括：

- `max_active_reservations_per_category`
- `no_show_credit_penalty`

同时把已有：

- `min_credit_score`
- `max_duration_minutes`
- `allowed_user_roles`

统一纳入同一 registry。

## 边界

- 活动报名资格在当前阶段采用**全局活动规则**，不新增活动规则绑定表，避免过早扩展配置面
- 预约次数与爽约处罚继续沿用现有资源绑定入口，优先把资源预约与惩罚闭环打通
- `UserRuleProfile` 当前先作为真实处罚结果画像写入，不额外补独立的 profile 管理界面

## 理由

- registry 足以把新增规则从核心 service 的 `if-else / switch` 中拆出来
- 不新增 DSL 平台，能更快把重点放在真实业务闭环和自动化验证上
- 活动规则先全局生效，能满足当前“活动报名资格进入真实链路”的最低正确解
- 资源绑定入口与现有预约模型天然贴合，适合优先承接次数限制和爽约处罚

## 影响

- 新增规则时，主流程不再需要继续堆分支
- 活动资格、预约次数限制和爽约处罚都已进入真实主链路
- `UserCreditLog` 与 `UserRuleProfile` 不再只是 schema，占到了真实业务写路径
