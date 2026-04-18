# CampusBook Platform

这个仓库现在同时承载两类内容：

- 项目正式文档与决策记录
- `CampusBook` 校园预约与活动平台的应用代码

当前推荐技术方案见 [technical-solution-v2.md](docs/architecture/technical-solution-v2.md)。

## 快速开始

1. 阅读 [docs/README.md](docs/README.md)
2. 查看 [docs/progress/agent-progress.md](docs/progress/agent-progress.md)
3. 查看 [docs/plans/feature-list.json](docs/plans/feature-list.json)
4. 运行 `bash scripts/init.sh`
5. 复制 `.env.example` 为 `.env`
6. 运行 `corepack enable`
7. 运行 `pnpm install`

## 应用目录

- `apps/web`：React + Vite 前端
- `apps/api`：NestJS 后端
- `packages/shared-types`：前后端共享类型
- `infra/docker-compose.yml`：单机开发编排
- `infra/nginx/`：基于 `server_name` 的前后端分流配置

## 常用命令

- `pnpm dev:web`
- `pnpm dev:api`
- `pnpm dev:worker`
- `pnpm build`
- `pnpm lint`
- `pnpm dev:stack`
- `pnpm seed:demo`

## 协作与约束

- 需求、规则、设计决策、执行计划都必须落到仓库中
- 每次只推进一个小目标
- 修改后必须更新进度记录和 git 提交
- 现有 `docs/reference/` 作为参考资料输入层，不直接替代执行文档
