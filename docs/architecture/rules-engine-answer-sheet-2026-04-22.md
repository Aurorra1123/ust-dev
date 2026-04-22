# 规则引擎答辩说明（2026-04-22）

## 结论

当前规则系统采用的是**强类型 handler registry**，不是通用脚本解释器，也不是把规则散落在核心流程里的 if-else。

它的答辩口径应该是：

- 规则类型有统一注册表
- 不同规则通过 handler 进入相同评估入口
- 资源绑定与启停状态由数据库驱动
- 业务主流程只负责装配上下文，不直接堆叠规则分支

## 当前结构

### 1. 统一规则入口

- 文件：
  - `apps/api/src/modules/rules/rules.service.ts`
- 关键职责：
  - 查询激活规则
  - 按资源绑定过滤规则
  - 组装 `RuleEvaluationContext`
  - 调用统一规则入口执行断言或处罚

`RulesService` 在活动报名与预约主链路中只做“取规则 + 组上下文 + 调用引擎”，不负责解释每条规则的业务含义。

### 2. 类型化 handler registry

- 文件：
  - `apps/api/src/modules/rules/rule-engine.ts`
- 关键职责：
  - 定义 `RuleHandler`
  - 注册 `RULE_HANDLERS`
  - 对外暴露：
    - `normalizeRuleDefinition`
    - `supportsRuleEvaluationScope`
    - `assertRuleSatisfied`
    - `applyNoShowRule`

每条规则类型对应一个 handler，handler 负责：

- 表达式归一化
- 适用场景声明
- 预约/活动报名断言
- 爽约后处罚动作

## 为什么这不是“核心逻辑堆 if-else”

因为规则分支没有散落在预约和活动业务主流程里：

- 预约流程不会直接写：
  - “如果是最小时长规则就怎样”
  - “如果是信用分规则就怎样”
  - “如果是角色规则就怎样”
- 活动流程也不会直接写多个规则类型判断

真正的类型分发集中在 `rule-engine.ts` 的 registry 中，这是规则层，而不是业务主链路层。

## 已支持的规则类型

- `min_credit_score`
- `max_duration_minutes`
- `allowed_user_roles`
- `max_active_reservations_per_category`
- `no_show_credit_penalty`

其中：

- 前四类走断言路径
- `no_show_credit_penalty` 走处罚路径

## 已进入真实主链路的场景

- 活动报名资格校验
- 学术/体育预约规则校验
- 爽约后扣分、画像更新和预约限制

这些都已有自动化验证：

- `qa-005-comp-003-rules-registry-and-penalty.md`
- `qa-007-comp-005-real-business-testing-and-judge-evidence.md`

## 扩展新规则的接入方式

新增一条规则时，当前只需要这几步：

1. 在共享类型里增加 `RuleType`
2. 在 `rule-engine.ts` 中增加一个 handler
3. 声明该规则支持的 `evaluationScopes`
4. 实现表达式校验和对应断言/处罚逻辑
5. 如有需要，在管理端补充规则编辑表单字段

这比把规则逻辑散落到多个 service 中更可控，也更容易测试。

## 当前方案的优点

- 规则扩展点集中
- 表达式校验与执行逻辑同域收口
- 启停、绑定关系和处罚结果都能落数据库
- 规则不需要侵入多个业务主流程

## 当前方案的限制

- 不是通用表达式引擎
- 不是 DSL 解析器
- registry 当前是静态注册，不是运行时动态装配插件

答辩时这点不要回避，直接说明：

“我们优先选择了比赛场景下更稳定、更可测试的强类型 registry，而不是为了通用性临时做一个脆弱的脚本解释器。”

## 建议答辩表述

可以直接这样回答：

“我们没有把规则写死在预约和活动主流程里，而是抽成了统一的规则入口和强类型 handler registry。业务层只负责提供上下文，规则层负责表达式校验、适用范围判断和执行动作。这样规则启停、资源绑定和处罚落库都能保持一致，同时新增规则时只需要补一个 handler，不需要去多个 service 里复制 if-else。” 
