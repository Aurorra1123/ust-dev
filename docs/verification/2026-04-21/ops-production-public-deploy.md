# OPS Production Public Deploy

## Date

- 2026-04-21

## Goal

- 将当前服务器切换到正式公网模式
- 验证以下公网入口可访问：
  - `https://campusbook.top`
  - `https://www.campusbook.top`
  - `https://api.campusbook.top/health`

## Preconditions

- 域名 `campusbook.top / www / api` 已解析到当前服务器公网 IP `47.251.174.28`
- 证书目录 `infra/nginx/.runtime/certbot/conf` 已存在有效 Let’s Encrypt 证书
- 当前服务器已安装 `docker` 与 `docker compose`

## Deployment Notes

- 仓库根目录原先不存在 `.env`，本轮已按生产模式生成
- 因 `docker-compose.yml` 位于 `infra/` 目录，本轮所有正式部署命令均显式使用 `--env-file .env`
- PostgreSQL 与 Redis 端口当前仅绑定到 `127.0.0.1`
- PostgreSQL 使用现有数据卷启动，未重建数据库卷

## Executed Commands

```bash
docker compose --env-file .env -f infra/docker-compose.yml config
docker compose --env-file .env -f infra/docker-compose.yml build api
docker compose --env-file .env -f infra/docker-compose.yml build web
docker compose --env-file .env -f infra/docker-compose.yml up -d postgres redis
docker compose --env-file .env -f infra/docker-compose.yml run --rm api pnpm --filter api prisma:migrate:deploy
docker compose --env-file .env -f infra/docker-compose.yml run --rm api pnpm --filter api seed:demo
docker compose --env-file .env -f infra/docker-compose.yml up -d api worker web nginx
docker compose --env-file .env -f infra/docker-compose.yml -f infra/docker-compose.https.yml up -d nginx
```

## Verification

```bash
curl -I https://campusbook.top
curl -I https://www.campusbook.top
curl -i https://api.campusbook.top/health
curl -I http://campusbook.top
curl -i -X POST https://api.campusbook.top/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"demo@campusbook.top","password":"<production-demo-password>"}'
curl -i -X POST https://api.campusbook.top/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"admin@campusbook.top","password":"<production-admin-password>"}'
```

## Result

- `https://campusbook.top` 返回 `HTTP/2 200`
- `https://www.campusbook.top` 返回 `HTTP/2 200`
- `https://api.campusbook.top/health` 返回 `HTTP/2 200`
- `http://campusbook.top` 返回 `301` 并跳转到 `https://campusbook.top/`
- 学生演示账号登录成功
- 管理员演示账号登录成功

## Runtime Status

- `infra-nginx-1` 监听 `80` 与 `443`
- `infra-api-1`、`infra-worker-1`、`infra-web-1` 均处于 `Up`
- `infra-postgres-1`、`infra-redis-1` 健康检查通过
