# Reference Mapping

## 目标

本文件定义 `docs/reference/` 的归属、维护策略和正式入口映射，避免新会话每次都直接从输入材料层重新推断系统。

## 分层原则

- `docs/reference/`
  - 输入材料层
  - 默认只读、低频修改
  - 仅在原始题面、重建材料或拆分方式本身需要修订时变更
- `docs/architecture/` 与 `docs/standards/`
  - 正式维护层
  - 日常开发默认从这里读取上下文
- `docs/progress/` 与 `docs/plans/`
  - 执行状态层
  - 记录当前进度、任务完成度和阶段性事实

## 归属与维护策略

| 输入材料 | 主要内容 | 正式入口 | 默认维护责任 | 触发更新时机 |
| --- | --- | --- | --- | --- |
| `01_需求说明.md` | 功能范围、角色、交付约束 | `docs/architecture/product-baseline.md` | 功能实现者 + 文档维护者 | 产品范围、角色或交付边界变化 |
| `02_规则说明.md` | 业务判定规则 | `docs/standards/business-rules-baseline.md` | 后端/规则实现者 | 预约、活动、订单、规则逻辑变化 |
| `03_系统架构图.md` | 架构分层与模块关系 | `docs/architecture/technical-solution-v2.md`、`docs/architecture/architecture-diagrams.md` | 架构/基础设施变更提交者 | 服务边界、部署结构、关键中间件变化 |
| `04_用户流程图.md` | 用户主流程 | `docs/architecture/product-baseline.md` | 前端/产品流实现者 | 用户路径或页面主流程变化 |
| `05_订单状态机图.md` | 状态迁移规则 | `docs/standards/business-rules-baseline.md` | 订单状态机实现者 | 状态、迁移权限或超时逻辑变化 |
| `06_ER图_数据库关系图.md` | 领域模型和实体关系 | `docs/architecture/domain-model-baseline.md`、`apps/api/prisma/schema.prisma` | schema/migration 提交者 | Prisma schema 或关键业务实体变化 |

## 当前建议阅读顺序

新会话优先按以下顺序恢复上下文：

1. `docs/progress/agent-progress.md`
2. `docs/plans/feature-list.json`
3. `docs/architecture/product-baseline.md`
4. `docs/standards/business-rules-baseline.md`
5. `docs/architecture/domain-model-baseline.md`
6. 需要时再回看 `docs/reference/`

## 同步规则

- 改代码且影响正式行为时，不应只改 `reference/`
- 改正式规则时，应让代码、正式文档和验证证据处于同一次提交中
- `reference/` 继续保留为来源材料，不承担当前实现状态维护职责
