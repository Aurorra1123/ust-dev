# APP-003 Prisma And Runtime Health Validation

## 日期

- 2026-04-17 (Asia/Shanghai)

## 验证目标

- 验证 API 已接入可复用的 `PrismaService`
- 验证应用启动时会校验环境变量并读取 `DATABASE_URL`、`REDIS_URL`
- 验证 `GET /health` 能返回 PostgreSQL 和 Redis 的真实连通状态

## 过程中修复的问题

- 初次接入后，`/health` 能正确发现依赖状态，但 PostgreSQL 一直返回 `down`
- 根因不是数据库不可达，而是 Prisma 在容器内生成了错误的运行时引擎：
  - Alpine 镜像阶段缺失 `libssl`
  - 切到 Debian 后，如果构建期未安装 `openssl`，Prisma 仍会回退到错误的 `openssl-1.1.x` 引擎
- 修复方式：
  - 将 `infra/docker/api.Dockerfile` 从 `node:20-alpine` 切换为 `node:20-bookworm-slim`
  - 在镜像构建期显式安装 `openssl`

## 验证命令

### 1. 重建 API 镜像

```bash
docker compose -f infra/docker-compose.yml build api
```

### 2. 启动修复后的 API 容器

```bash
docker compose -f infra/docker-compose.yml up -d api
```

### 3. 查看容器状态

```bash
docker compose -f infra/docker-compose.yml ps
```

结果摘要：

```text
infra-api-1      Up
infra-postgres-1 Up
infra-redis-1    Up
infra-nginx-1    Up
infra-web-1      Up
```

### 4. 查看 API 启动日志

```bash
docker compose -f infra/docker-compose.yml logs --tail=80 api
```

结果摘要：

```text
[PrismaService] PostgreSQL connection established
[NestApplication] Nest application successfully started
```

### 5. 通过 Nginx 验证健康检查

```bash
curl --connect-timeout 3 -sS -H 'Host: api.campusbook.top' http://127.0.0.1/health
```

结果摘要：

```json
{
  "service": "campusbook-api",
  "status": "ok",
  "dependencies": {
    "postgres": "up",
    "redis": "up"
  },
  "checks": {
    "postgres": "query-ok",
    "redis": "pong"
  }
}
```

## 结论

- `APP-003` 已达到验收条件
- API 已具备全局环境校验、可复用的 `PrismaService` 与 `RedisService`
- 健康检查已从“仅表示配置存在”提升为“真实反映 PostgreSQL 和 Redis 运行状态”
- 当前单机开发栈可以在既定域名结构下继续推进鉴权和数据模型开发

## 备注

- 本次对 `127.0.0.1:80` 的 HTTP 验证仍需使用提权命令，因为普通沙箱无法访问本地监听端口
