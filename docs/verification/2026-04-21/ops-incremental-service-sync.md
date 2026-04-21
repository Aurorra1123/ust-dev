# OPS Incremental Service Sync

## Date

- 2026-04-21

## Goal

- 将“功能改动后按受影响服务做增量发布”的规则落入长期标准
- 将当前线上实例同步到仓库最新业务代码

## Deployment Scope

- `api`
- `worker`
- `web`

本轮未重启整台服务器，未重建 PostgreSQL、Redis、Nginx。

## Why This Sync Was Needed

- 仓库当前 `HEAD` 为 `61f8a43 feat(notification): support image notices`
- 仓库源码已包含：
  - `NotificationsModule`
  - `/notifications`
  - `/admin/notifications`
  - 学生首页通知区与通知图片渲染
- 同步前线上检查结果：
  - `https://api.campusbook.top/notifications` 返回 `404`
  - `https://api.campusbook.top/admin/notifications` 返回 `404`
  - 线上前端 bundle 仍为旧哈希 `index-BTfeiKLl.js`

## Executed Commands

```bash
docker compose --env-file .env -f infra/docker-compose.yml run --rm api pnpm --filter api prisma:migrate:deploy
docker compose --env-file .env -f infra/docker-compose.yml build api
docker compose --env-file .env -f infra/docker-compose.yml build web
docker compose --env-file .env -f infra/docker-compose.yml up -d --no-deps api worker web
```

## Verification

```bash
curl -i https://api.campusbook.top/health
curl -i https://api.campusbook.top/notifications
curl -s https://campusbook.top/ | rg -o '/assets/index-[^" ]+\\.js'
curl -s https://campusbook.top/assets/index-CfShXjUs.js | rg '首页通知|Latest Notices|/notifications|通知工作区|imageUrl'
docker compose --env-file .env -f infra/docker-compose.yml -f infra/docker-compose.https.yml ps
```

## Result

- `https://api.campusbook.top/health` 返回 `200`
- `https://api.campusbook.top/notifications` 返回 `200`
- 线上前端 bundle 已切换为 `index-CfShXjUs.js`
- 新 bundle 中已可检出通知区与通知接口相关特征
- `infra-api-1`、`infra-worker-1`、`infra-web-1` 均已完成重建并运行

## Notes

- 本轮 `prisma:migrate:deploy` 结果为 `No pending migrations to apply`
- 构建阶段在沙箱内会因 `/root/.docker/buildx` 只读而失败，实际发布使用宿主 Docker 环境完成
