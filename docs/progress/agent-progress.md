# Agent Progress Log

本文件用于跨会话交接，任何一次较完整的工作结束前都应更新。

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

### 下一步建议

1. 为 API 增加真实数据库连接、配置模块与 Prisma Service
2. 开始实现认证、资源建模与预约主流程
3. 为基础联调补充自动化健康检查或 smoke test
4. 后续按同一域名结构补齐 HTTPS
5. 逐步将参考资料映射为更细化的正式产品与技术文档

### 注意事项

- 后续 agent 开始工作前，先读本文件和 `docs/plans/feature-list.json`
- 每次只推进一个高优先级任务，避免同时改太多内容
