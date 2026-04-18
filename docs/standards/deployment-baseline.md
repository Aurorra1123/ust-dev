# Deployment Baseline

## 目标

固化当前项目的长期有效部署基线，确保后续前后端部署、Nginx 分流和 HTTPS 升级都基于同一套约束执行。

## 服务器信息

- OS: `Linux 5.10.134-17.2.al8.x86_64`
- Shell: `bash`
- Repo Path: `/data/ustdev/ust-dev`
- Public IP: `47.251.174.28`
- Private IP: `172.18.8.226`
- Resource: `2 vCPU / 2 GiB RAM / 60 GiB disk`
- Docker: `26.1.3`

## 域名结构

- `campusbook.top` -> frontend
- `www.campusbook.top` -> frontend
- `api.campusbook.top` -> backend

以上域名解析已确认指向 `47.251.174.28`。

## Nginx 路由要求

- 必须基于 `server_name` 区分前端与后端流量
- 前端必须同时支持裸域 `campusbook.top` 和 `www.campusbook.top`
- 后端必须使用 `api.campusbook.top`
- 当前阶段先提供 HTTP 配置
- 配置结构必须便于后续无缝升级到 HTTPS

## 推荐 HTTP 站点划分

### frontend server

- `listen 80`
- `server_name campusbook.top www.campusbook.top`
- 提供前端静态资源或反向代理到前端服务

### backend server

- `listen 80`
- `server_name api.campusbook.top`
- 反向代理到后端应用服务

## HTTPS 升级约束

- 不改变域名分工
- 不改变基于 `server_name` 的路由边界
- HTTPS 证书需要覆盖 `campusbook.top`、`www.campusbook.top`、`api.campusbook.top`
- 升级时优先在现有 server block 结构上补充 `listen 443 ssl` 与跳转逻辑，避免重做路由设计

## HTTPS Ready 配置基线

- 基础 HTTP 编排继续使用 `infra/docker-compose.yml`
- HTTPS 升级追加 `infra/docker-compose.https.yml`
- 基础 HTTP 路由位于 `infra/nginx/conf.d/campusbook.conf`
- 443 与 `80 -> 443` 跳转配置模板位于 `infra/nginx/https-conf.d/campusbook-https.conf.template`
- ACME challenge 目录约定为 `infra/nginx/.runtime/certbot/www`
- Let’s Encrypt 证书目录约定为 `infra/nginx/.runtime/certbot/conf`

以上目录属于运行时产物，不进入 git。

## 应用层切换约束

- API 的 `ALLOWED_ORIGINS` 必须同时覆盖：
  - `http://campusbook.top`
  - `http://www.campusbook.top`
  - `https://campusbook.top`
  - `https://www.campusbook.top`
- 前端默认 API 地址不得硬编码为单一协议；应优先跟随当前页面协议推导 `api.campusbook.top`
- 切换到正式 HTTPS 时，`NODE_ENV` 必须为 `production`，以便 refresh token Cookie 自动启用 `secure`

## 运维要求

- 部署文档中的域名、端口、服务归属必须与本文件一致
- 如果后续变更域名结构、反向代理边界或发布拓扑，必须新增 ADR 记录

## 单机资源保护

当前服务器仅有 `2 vCPU / 2 GiB RAM`，后续开发、联调和部署必须默认按低余量机器处理。

- 不并行执行高负载命令：
  - `pnpm build`
  - `pnpm lint`
  - `pnpm typecheck`
  - `docker compose build`
- 高负载校验默认顺序执行，避免同时触发 `tsc`、`vite`、`eslint`、`prisma generate`
- 优先执行局部验证：
  - 改后端时优先 `pnpm --filter api ...`
  - 改前端时优先 `pnpm --filter web ...`
  - 改容器配置时优先重建受影响服务，而不是全量重建整栈
- `docker compose up -d api`、`build api` 这类局部动作优先于整套 `up --build`
- 未到里程碑验收前，不重复做全栈重建和整站联调
- 新增 `worker`、压测、E2E 浏览器任务前，先确认内存余量，必要时先停掉非关键容器
- 对外只保留必要常驻服务，避免在宿主机长期并行运行多个 dev server、watcher、构建进程
- 若出现持续卡顿，先检查：
  - `uptime`
  - `ps -eo pid,ppid,pcpu,pmem,etime,cmd`
  - `docker compose -f infra/docker-compose.yml ps`
