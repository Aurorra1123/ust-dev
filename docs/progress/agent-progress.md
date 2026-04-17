# Agent Progress Log

本文件用于跨会话交接，任何一次较完整的工作结束前都应更新。

## 2026-04-17

### 已完成

- 完成 `APP-003`：为 API 接入全局 `ConfigModule` 与环境变量校验
- 新增 `InfrastructureModule`、`PrismaService`、`RedisService`
- 将 `GET /health` 从静态占位改为真实检测 PostgreSQL 与 Redis 状态
- 修复 Prisma 在容器运行时的 OpenSSL 兼容问题：
  - `infra/docker/api.Dockerfile` 改为 `node:20-bookworm-slim`
  - 镜像构建期显式安装 `openssl`
- 验证通过 `api.campusbook.top/health` 返回 `postgres=up`、`redis=up`
- 新增验证证据 `docs/verification/2026-04-17/app-003-prisma-health.md`
- 完成 `APP-004`：新增 `login`、`refresh`、`logout` 认证接口
- 接入 `@nestjs/jwt` 与 `cookie-parser`，access token 走响应体，refresh token 走 `HttpOnly` Cookie
- 新增演示账号环境变量 `DEMO_USER_EMAIL`、`DEMO_USER_PASSWORD`、`DEMO_USER_ROLE`
- 验证通过登录、刷新令牌、退出与退出后 refresh 失效
- 新增验证证据 `docs/verification/2026-04-17/app-004-auth-cookie-flow.md`
- 为后续 `autonomous` 开发补充仓库级安全规则，禁止危险删除并限制默认操作边界
- 完成 `APP-005`：扩展 Prisma schema，补齐用户、资源、资源单元、活动、订单等核心数据模型
- 新增首轮 migration `20260417015325_init_core_models` 并成功应用到 PostgreSQL
- 同步扩展共享类型中的核心枚举与实体接口
- 新增验证证据 `docs/verification/2026-04-17/app-005-core-data-model.md`
- 完成 `APP-006`：新增学术空间预约模型、接口与事务写入骨架
- 新增 migration `20260417020123_academic_reservation_flow`，为学术空间预约引入数据库排斥约束
- 验证通过正常预约、缓冲区冲突以及数据库层防重叠兜底
- 新增验证证据 `docs/verification/2026-04-17/app-006-academic-reservation.md`
- 完成 `APP-008`：补齐订单状态机服务、状态迁移接口与超时取消入口
- 验证通过 `PENDING_CONFIRMATION -> CONFIRMED -> NO_SHOW` 链路
- 验证通过超时取消将订单迁移到 `CANCELLED`
- 新增验证证据 `docs/verification/2026-04-17/app-008-order-state-machine.md`
- 完成 `APP-007`：新增体育设施槽位预约与组合预约接口
- 新增 migration `20260417023023_sports_slot_booking`，引入 `SportsReservationSlot` 模型与有效占用唯一索引
- 验证通过单资源预约、组合预约、任一单元冲突时整单失败
- 验证通过订单取消后体育槽位状态同步为 `CANCELLED`，槽位可重新释放
- 新增验证证据 `docs/verification/2026-04-17/app-007-sports-reservation.md`
- 新增 `scripts/watchdog.sh`，用于监控 tmux pane 静默状态并按上限自动发送 `continue`
- watchdog 支持 `-n` 参数控制最多自动继续轮数，并支持轮询间隔、静默阈值、阻断正则与日志路径配置
- 通过临时 tmux pane 验证 watchdog 在静默后发送 1 次消息并按上限正常退出

### 当前状态

- `APP-001`、`APP-002`、`APP-003`、`APP-004`、`APP-005`、`APP-006`、`APP-007`、`APP-008` 已通过
- API 已具备真实依赖健康检查能力和最小认证闭环
- 数据库已具备统一资源、活动、订单主数据骨架和学术空间预约防重叠约束
- 订单状态机已经具备状态日志与可执行超时取消入口
- 体育设施已具备离散槽位预约、组合预约与数据库层冲突兜底
- 当前认证实现仍是演示账号模式，后续需接入正式用户模型
- 当前 Compose 栈仍保持运行，可用于下一阶段最小范围联调

### 下一步建议

1. 按规则先抽样回归一个已通过核心流程
2. 开始 `APP-009`，实现活动发布与抢票基础链路
3. 随后推进 `APP-010`，补齐规则引擎初版

### 注意事项

- Prisma 运行时依赖镜像内的 `openssl`；后续调整 API 基础镜像时需一并保留
- 对本地 `127.0.0.1:80` 的 Nginx 验证仍需使用提权命令
- 完成新的阶段性功能后，继续按“留证据 -> 更新状态 -> git 提交”的顺序收口

## 2026-04-16

### 已完成

- 初始化 git 仓库
- 建立 docs 执行层目录：`plans/`、`progress/`、`standards/`、`adr/`
- 新增目录导航、任务清单、git 工作流、工程规则、ADR 模板、初始化脚本
- 保留现有 `docs/reference/` 资料作为输入层
- 新增 agent 长周期执行规则文档 `docs/standards/agent-harness-rules.md`
- 新增部署基线文档 `docs/standards/deployment-baseline.md`
- 记录 harness-first 工作流 ADR 与域名分流 ADR
- 固化 `campusbook.top` / `www.campusbook.top` / `api.campusbook.top` 的部署域名结构
- 修正仓库根 README 中过期的绝对路径链接
- 新增 `docs/architecture/`，归档技术方案 V1 并产出修订版 V2
- 新增架构图文档与开发环境核查文档
- 记录单机 TypeScript 平台基线 ADR `0004`
- 初始化 monorepo 根配置、`pnpm workspace` 与共享包骨架
- 新增 `apps/web` React + Vite 前端基础工程
- 新增 `apps/api` NestJS 后端基础工程与 Prisma 初始 schema
- 新增 `infra/docker-compose.yml`、Nginx 域名分流配置与最小 GitHub Actions CI
- 生成 `pnpm-lock.yaml` 并完成首轮依赖安装
- 验证通过 `pnpm lint`、`pnpm build`
- 验证通过 `docker compose -f infra/docker-compose.yml build web api`
- 固化“先回归，再开发”规则
- 新增 `docs/verification/README.md` 作为验证证据落位规范
- 固化会话结束前更新状态、记录证据并保持工作区干净的退出条件
- 修复 `api` 容器产物输出路径问题，将生产构建切换为 `tsc -p tsconfig.json`
- 验证通过整套 Compose 启动与基础 HTTP 联调
- 新增验证证据 `docs/verification/2026-04-17/foundation-stack-connectivity.md`
- 将 `docs/plans/feature-list.json` 重写为面向当前应用开发主线的新任务清单

### 当前状态

- 仓库已经具备基础协作骨架
- 已存在可继续开发的前后端与基础设施代码骨架
- 已形成 agent 执行规则与部署基线的长期文档入口
- 已形成回归优先、验证证据和干净结束的长期规则
- 域名分流规则已明确为前端裸域与 `www`，后端 `api` 子域
- 已形成当前推荐技术方案 V2 与配套架构图
- 当前服务器已激活 `pnpm` 并具备单机开发所需的基础依赖
- 已具备基础 Nginx 与 Compose 配置，且整套容器已完成首次联调
- `campusbook.top`、`www.campusbook.top`、`api.campusbook.top` 的 HTTP 路由已验证通过
- 当前仍未启用 HTTPS，数据库与缓存也尚未接入真实业务逻辑
- 当前 `feature-list` 已切换为以应用交付为主的 `APP/OPS/DOCS` 任务结构

### 下一步建议

1. 为 API 增加真实数据库连接、配置模块与 Prisma Service
2. 开始实现认证、资源建模与预约主流程
3. 为基础联调补充自动化健康检查或 smoke test
4. 后续按同一域名结构补齐 HTTPS
5. 逐步将参考资料映射为更细化的正式产品与技术文档

### 注意事项

- 后续 agent 开始工作前，先读本文件和 `docs/plans/feature-list.json`
- 每次只推进一个高优先级任务，避免同时改太多内容
