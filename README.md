# CampusBook（智约校园）

一个面向校园场景的统一预约与活动平台，覆盖学术空间、体育设施、校园活动和后台管理。

## 项目简介

校园里的预约入口通常比较分散：学术空间、体育场地、校园活动往往不在同一套系统里，规则也不统一，热门活动还容易在高峰期出现排队混乱或超卖问题。`CampusBook` 想解决的，就是把这些常见场景放进同一个入口，让学生和管理员都能更清楚地完成预约、报名和管理。

它和普通的预约网站不太一样。这个项目不是只做“场地预约”，而是把学术空间预约、体育设施预约、活动报名/抢票放进同一套账号、订单、规则和后台体系里；不同业务用不同的预约模型，但最终都落到统一的订单中心和管理工作台。

## 核心功能

- 学术空间预约：支持按连续时间段预约讨论室等学术空间，后端会把前后 `5` 分钟缓冲一起纳入冲突判断。
- 体育设施预约：支持按 `1` 小时槽位预约体育资源，也支持组合场地；只要任一槽位冲突，整单就会失败。
- 校园活动报名 / 抢票：支持活动发布、票种管理和报名；热门活动请求会先走 Redis 预扣和 Worker 异步建单。
- 订单状态管理：学术预约、体育预约、活动报名统一进入订单中心，可查看状态、取消订单，并处理签到/缺席等后续状态。
- 规则限制 / 拦截：支持按资源绑定角色、信用分、预约时长、可预约次数等规则；缺席还会触发扣分和限制处理。
- 后台管理：当前仓库已实现 `/admin` 工作台，可维护体育场馆、学术空间、活动、规则、通知和工单。

## 技术栈

- 前端：`React 18`、`TypeScript`、`Vite`、`React Router`、`TanStack Query`、`Zustand`、`Tailwind CSS`
- 后端：`NestJS`、`TypeScript`、`Prisma`、`BullMQ`
- 数据库：`PostgreSQL`
- 缓存 / 队列：`Redis`
- 部署方式：`Docker Compose + Nginx`，运行形态为 `Web + API + Worker + PostgreSQL + Redis`

## 快速开始

### 方式一：最快体验

适合评委验收、课堂演示，或者先把完整系统跑起来。

1. 准备环境：`Docker`、`Docker Compose`
2. 复制环境文件：

```bash
cp .env.judge.example .env.judge
```

3. 一键启动：

```bash
bash scripts/judge-up.sh
```

4. 访问地址：

- 前端：`http://localhost:8080`
- 管理端：`http://localhost:8080/admin`
- 后端健康检查：`http://localhost:8080/api/health`

说明：`judge-up` 会自动完成镜像构建、数据库重置、迁移、写入 demo 数据和 smoke 校验；如果你是在服务器上运行，把 `localhost` 换成服务器 IP 即可。

### 方式二：本地开发

适合前后端分开调试。

1. 准备环境：`Node.js 20+`、`pnpm 10.11.0`、`Docker`、`Docker Compose`
2. 安装依赖：

```bash
corepack enable
pnpm install
```

3. 准备环境变量：

```bash
cp .env.example .env
```

把 `.env` 里的这两个值改成本机地址：

```bash
DATABASE_URL=postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public
REDIS_URL=redis://127.0.0.1:6379
```

4. 启动数据库和 Redis：

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

5. 执行迁移并写入 demo 数据：

```bash
pnpm --filter api prisma:migrate:deploy
pnpm seed:demo
```

6. 分别启动后端、Worker 和前端：

```bash
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

7. 访问地址：

- 前端：`http://localhost:5173`
- 后端健康检查：`http://localhost:3000/health`

## 测试账号

当前仓库提供默认测试账号，来源于 `.env.example` 和 `.env.judge.example`：

- 学生：`demo@campusbook.top / demo123456`
- 管理员：`admin@campusbook.top / admin123456`
- 辅助学生：`partner1@campusbook.top / demo123456`
- 辅助学生：`partner2@campusbook.top / demo123456`

如果你要部署到公网环境，建议第一时间覆盖这些默认密码。

## 仓库结构

- `apps/web`：前端应用，包含学生端和 `/admin` 管理端
- `apps/api`：后端 API、Prisma、seed 脚本和 Worker 入口
- `packages/shared-types`：前后端共享类型
- `infra`：Docker Compose、Dockerfile 和 Nginx 配置
- `docs`：架构、部署、进度、验证和计划文档
- `scripts`：初始化、judge 启动和 smoke 脚本

## 相关文档

- [docs/architecture/product-baseline.md](docs/architecture/product-baseline.md)：产品范围和主要用户路径
- [docs/architecture/technical-solution-v2.md](docs/architecture/technical-solution-v2.md)：当前推荐技术方案
- [docs/architecture/current-implementation-audit-2026-04-21.md](docs/architecture/current-implementation-audit-2026-04-21.md)：当前代码真实实现到哪里
- [docs/standards/judge-quick-start.md](docs/standards/judge-quick-start.md)：评委验收 / 演示的一键启动说明
- [docs/progress/agent-progress.md](docs/progress/agent-progress.md)：最近阶段进度
- [docs/plans/feature-list.json](docs/plans/feature-list.json)：功能清单与完成状态

## 项目亮点

- 一套系统同时覆盖学术空间、体育设施、校园活动三个校园高频场景，不是单一预约页。
- 学术空间和体育设施使用不同的预约模型：前者是连续时间段加缓冲，后者是离散槽位和组合预约。
- 活动报名链路不是直接同步写库，而是用 `Redis + BullMQ + Worker` 处理高峰请求，避免把压力全压到数据库。
- 三类业务共用统一订单中心、规则拦截和后台工作台，体验和管理路径更清楚。
- 提供 judge 模式一键启动，适合答辩、演示和快速验收。

## AST 圈复杂度记录

截至 `2026-04-22`，仓库已完成一轮基于 AST 的圈复杂度治理，覆盖前端热点页面、预约面板和后端核心服务函数。

本轮计划内已完成收口的热点包括：

- `ResourcesWorkspace`
- `OrderDetailPage`
- `ActivitiesWorkspace`
- `ActivitiesPage`
- `RulesEditorPanel`
- `SpacesBookingPanel`
- `SportsBookingPanel`
- `ReservationService.createSportsReservation`
- `OrdersService.transitionOrder`
- `normalizeActivityTimeline`

最终 AST 汇总结果：

- `analyzedFiles = 162`
- `analyzedFunctions = 1278`
- `over10 = 36`
- `over15 = 15`
- `over20 = 5`
- `over30 = 1`

当前剩余 `>20` 热点：

1. `RulesWorkspace` `38`
2. `SpacesPage` `28`
3. `SportsPage` `27`
4. `NotificationsWorkspace` `24`
5. `toOrderDetail` `21`

完整留证见：

- [docs/verification/2026-04-22/qa-017-cyclomatic-final-ast-report.md](docs/verification/2026-04-22/qa-017-cyclomatic-final-ast-report.md)
