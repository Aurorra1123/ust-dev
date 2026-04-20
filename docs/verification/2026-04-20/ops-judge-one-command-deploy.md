# OPS Judge One-Command Deploy Validation

日期：2026-04-20

## 目标

验证新的 judge 安装流程是否满足以下要求：

- 不依赖真实域名
- 不依赖 HTTPS
- 可通过单一脚本完成构建、迁移、seed、启动和最小 smoke 校验
- 访问入口统一为 `http://127.0.0.1:8080`

## 本次验证使用的环境文件

- `.env.judge.example`

关键值：

- `NGINX_HTTP_PORT=8080`
- `ALLOWED_ORIGINS=http://127.0.0.1:8080,http://localhost:8080`
- `CAMPUSBOOK_API_BASE_URL=/api`

## 执行命令

### 1. 展开 judge compose 配置

```bash
docker compose --env-file .env.judge.example \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.judge.yml \
  config
```

结果：通过。

确认点：

- `web` 的 `CAMPUSBOOK_API_BASE_URL` 为 `/api`
- `nginx` 使用 `infra/nginx/judge-conf.d`
- `worker` 与 `api` 都显式获得运行所需环境变量

### 2. 前端静态产物校验

```bash
pnpm --filter web typecheck
pnpm --filter web build
```

结果：通过。

### 3. judge web 镜像构建

```bash
docker compose --env-file .env.judge.example \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.judge.yml \
  build web
```

结果：通过。

确认点：

- `infra/docker/web-default.conf` 已成功复制进镜像
- `infra/docker/40-write-runtime-config.sh` 已成功复制并赋予执行权限

### 4. judge 一键启动

```bash
bash scripts/judge-up.sh .env.judge.example
```

结果：通过。

脚本完成了以下动作：

1. 构建 `api` 镜像
2. 构建 `web` 镜像
3. 启动 `postgres` 与 `redis`
4. 执行 `prisma migrate deploy`
5. 执行 `seed:demo`
6. 启动 `api / worker / web / nginx`
7. 运行 `scripts/smoke-judge.mjs`

## Smoke 结果摘要

输出：

```json
{
  "status": "ok",
  "checkedAt": "2026-04-20T15:35:44.052Z",
  "counts": {
    "academicResources": 2,
    "adminResources": 3,
    "adminRules": 3
  }
}
```

说明：

- judge 首页可正常访问
- `GET /api/health` 返回 `status=ok`
- 学生登录成功
- 管理员登录成功
- judge Nginx 已将 refresh cookie 的 `Path` 重写为 `/api/auth`
- 学生与管理员保护接口均可访问

## 收尾

验证完成后已执行：

```bash
docker compose --env-file .env.judge.example \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.judge.yml \
  down
```

说明：

- 仅停止并移除容器与网络
- 未删除数据卷
