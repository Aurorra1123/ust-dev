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
- 未知 hostname 不得默认猜测生产 API 域名；若运行环境不是正式域名或本地开发环境，必须通过运行时配置或环境变量显式提供 API 地址
- 切换到正式 HTTPS 时，`NODE_ENV` 必须为 `production`，以便 refresh token Cookie 自动启用 `secure`

## 运维要求

- 部署文档中的域名、端口、服务归属必须与本文件一致
- 如果后续变更域名结构、反向代理边界或发布拓扑，必须新增 ADR 记录

## 增量发布规则

当前生产环境运行在 Docker 容器中。代码改动后，必须同步部署受影响的服务；仅刷新网页或普通重启容器，不等于上线新代码。

- 不需要重启整台服务器
- 默认只重建并替换受影响的服务，不做整栈重建
- 生产 compose 命令统一显式使用 `--env-file .env`
- `infra/docker-compose.yml` 位于子目录，且 `web` 容器会把运行时变量写入 `/config.js`；如果省略 `--env-file .env`，前端会回退到 compose 默认 demo 凭据，造成快捷登录填充与 API 实际账号密码不一致
- 仅文档改动不触发生产服务重建

### 前端改动

- 改动 `apps/web`、前端静态资源、前端构建配置后，执行：

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web
```

### 后端改动

- 改动 `apps/api` 业务逻辑、共享类型且影响运行时接口后，执行：

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps api worker
```

### 数据库迁移

- 只要 Prisma schema 或 migration 有变更，先执行：

```bash
docker compose --env-file .env -f infra/docker-compose.yml run --rm api pnpm --filter api prisma:migrate:deploy
```

- 然后再重建 `api/worker`

### Nginx 与证书改动

- 改动 `infra/nginx/`、`infra/docker-compose.https.yml` 或证书相关配置后，执行：

```bash
docker compose --env-file .env -f infra/docker-compose.yml -f infra/docker-compose.https.yml up -d nginx
```

### 发布后验证

- 每次增量发布后，至少验证：
  - `https://campusbook.top`
  - `https://www.campusbook.top`
  - `https://api.campusbook.top/health`
- 如果本轮修改涉及具体业务入口，还要补对应业务 smoke 验证
- 如果本轮修改涉及前端运行时配置、demo 凭据或登录快捷带入，还要额外验证：
  - `https://campusbook.top/config.js` 中的运行时值是否与根 `.env` 一致
  - 学生 demo 登录接口返回 `200`
  - 管理员 demo 登录接口返回 `200`

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
