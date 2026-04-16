# ADR 0004: Adopt A Single-Node TypeScript Platform Baseline

## Status

Accepted

## Context

项目需要在比赛周期内快速交付一个可公网演示的平台，同时满足多类型预约、活动抢票、统一订单状态机、动态规则引擎和容器化交付等要求。当前服务器资源固定为单台 `2 vCPU / 2 GiB RAM`，并且域名结构已确定为前端双域名与后端 API 子域名分流。

## Decision

采用以下技术基线：

- 前端：`React + TypeScript + Vite`
- 后端：`NestJS + TypeScript + Prisma`
- 数据库：`PostgreSQL`
- 缓存与队列：`Redis + BullMQ`
- 入口代理：`Nginx`
- 编排：`Docker Compose`
- 仓库组织：monorepo
- 路由边界：
  - `campusbook.top`
  - `www.campusbook.top`
  - `api.campusbook.top`

关键一致性约束：

- 学术空间预约通过数据库排斥约束防止时间重叠
- 体育设施通过离散槽位唯一约束保障冲突校验
- 活动抢票通过 Redis 预扣、队列异步建单和数据库唯一约束防超发
- 订单状态流转通过 CAS 与状态日志保证最终一致

详细方案维护在 `docs/architecture/technical-solution-v2.md`。

## Consequences

- 技术栈统一在 TypeScript 生态，开发上下文切换较少
- 单机部署路径明确，适合比赛交付节奏
- 高并发热点路径被单独强化，避免全链路过度设计
- 对内存和容器数量较敏感，需要严格控制基础设施规模
