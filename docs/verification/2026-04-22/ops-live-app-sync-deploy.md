# OPS Live App Sync Deploy

## 时间

- 2026-04-22

## 目标

把当前工作区代码同步到线上应用层服务，确保网页端与 API / worker 一致，不再停留在旧的 demo 密码暴露口径。

## 本轮执行

### 1. 构建并切换应用层服务

执行：

```bash
docker compose -f infra/docker-compose.yml build api web
docker compose -f infra/docker-compose.yml up -d --no-deps api worker web
```

本轮只重建和重启：

- `api`
- `worker`
- `web`

未重启：

- `postgres`
- `redis`
- `nginx`

### 2. 发现并修复 API 镜像问题

首次切换后，`web` 已更新，但 `api` 返回 `502`。

定位结果：

- `infra-api-1` 日志报错：
  - `@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.`
- 根因是 `infra/docker/api.Dockerfile` 的 runner 阶段仍从 `deps` 复制 `node_modules`
- `prisma generate` 发生在 `builder` 阶段，因此运行镜像缺少生成后的 Prisma Client 产物

修复：

- 将 `infra/docker/api.Dockerfile` 的 runner 拷贝源统一改为 `builder`

重新执行：

```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d --no-deps api worker
```

## 部署后验证

### 容器状态

```text
infra-worker-1     campusbook-api-runtime   Up
infra-web-1        infra-web                Up
infra-api-1        campusbook-api-runtime   Up
infra-nginx-1      nginx:1.27-alpine        Up
infra-redis-1      redis:7-alpine           Up (healthy)
infra-postgres-1   postgres:16-alpine       Up (healthy)
```

### 网页端版本指纹

线上首页：

```html
<script type="module" crossorigin src="/assets/index-IzXMXhje.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-1kvsNax0.css">
```

### 运行时配置

线上 `https://campusbook.top/config.js`：

```js
window.__CAMPUSBOOK_CONFIG__ = Object.freeze({
  apiBaseUrl: "",
  demoAccounts: Object.freeze({
    student: Object.freeze({
      email: "demo@campusbook.top"
    }),
    admin: Object.freeze({
      email: "admin@campusbook.top"
    })
  })
});
```

验证结论：

- 已不再向前端公开 demo/admin 密码
- 已切换到新口径 `demoAccounts`

### API 健康检查

```bash
curl -s https://api.campusbook.top/health
```

结果：

```json
{"service":"campusbook-api","status":"ok","timestamp":"2026-04-22T12:53:16.596Z","dependencies":{"postgres":"up","redis":"up"},"checks":{"postgres":"query-ok","redis":"pong"}}
```

### 认证边界抽检

执行：

```bash
curl -s -o /tmp/non_whitelist_login_after_fix.json -w '%{http_code}' \
  -X POST https://api.campusbook.top/auth/login \
  -H 'content-type: application/json' \
  --data '{"email":"guardrail-auth-1@campusbook.top","password":"demo123456"}'
```

结果：

```text
401
```

验证结论：

- 非白名单学生已不能复用 demo 学生密码

## 影响

- 网页端、API、worker 已同步到当前代码版本
- 线上 demo 密码暴露面已关闭
- 中途出现一次短暂 `502`，原因已定位并通过镜像修复消除
