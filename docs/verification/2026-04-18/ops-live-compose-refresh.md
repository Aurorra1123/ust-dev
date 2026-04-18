# OPS Live Compose Refresh

日期：2026-04-18

## 目标

将域名入口切到当前仓库已完成的 `APP-011` 版本，同时避免在 `2 vCPU / 2 GiB RAM / 0 swap` 机器上触发全栈重建过载。

## 执行顺序

1. `docker compose -f infra/docker-compose.yml stop web api worker`
2. `docker compose -f infra/docker-compose.yml build api`
3. `docker compose -f infra/docker-compose.yml up -d api worker`
4. 容器内健康检查：`node -e "fetch('http://127.0.0.1:3000/health')..."`
5. `docker compose -f infra/docker-compose.yml build web`
6. `docker compose -f infra/docker-compose.yml up -d web`
7. `docker compose -f infra/docker-compose.yml restart nginx`

## 验证结果

- `curl -sS --max-time 5 -i http://api.campusbook.top/health`
  - 返回 `HTTP/1.1 200 OK`
  - 依赖状态：`postgres=up`、`redis=up`
- `curl -sS --max-time 5 http://campusbook.top/`
  - 返回最新前端 `index.html`
  - 页面标题：`CampusBook`
- `docker compose -f infra/docker-compose.yml ps`
  - `api`
  - `worker`
  - `web`
  - `nginx`
  - `postgres`
  - `redis`
  全部处于 `Up` 状态

## 结论

- 域名入口已经切到当前前后端版本
- 这次采用顺序构建和单服务重启，没有做并行镜像构建
- `nginx` 在 `api/web` 容器重建后需要重启一次，避免继续持有旧 upstream 地址
