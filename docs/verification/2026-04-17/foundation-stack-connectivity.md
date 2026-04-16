# Foundation Stack Connectivity Validation

## 日期

- 2026-04-17 (Asia/Shanghai)

## 验证目标

- 验证 `docker compose` 可拉起 `PostgreSQL`、`Redis`、`API`、`Web`、`Nginx`
- 验证 Nginx 能基于 `server_name` 区分前后端流量
- 验证 `campusbook.top`、`www.campusbook.top`、`api.campusbook.top` 的 HTTP 路由生效

## 过程中修复的问题

- `api` 容器最初无法启动，报错找不到 `/workspace/apps/api/dist/main.js`
- 原因是 `nest build` 在当前 monorepo 配置下将产物错误写入了 `packages/tsconfig/dist`
- 修复方式：
  - 在 `apps/api/tsconfig.json` 中显式固定 `outDir`
  - 将 `apps/api/package.json` 中的生产构建改为 `tsc -p tsconfig.json`

## 验证命令

### 1. 启动栈

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. 查看容器状态

```bash
docker compose -f infra/docker-compose.yml ps
```

结果摘要：

```text
infra-api-1      Up
infra-nginx-1    Up
infra-postgres-1 Up
infra-redis-1    Up
infra-web-1      Up
```

### 3. 验证 API 子域名

```bash
curl -H 'Host: api.campusbook.top' http://127.0.0.1/health
```

结果摘要：

```json
{
  "service": "campusbook-api",
  "status": "ok",
  "dependencies": {
    "postgres": "configured",
    "redis": "configured"
  }
}
```

### 4. 验证前端裸域

```bash
curl -I -H 'Host: campusbook.top' http://127.0.0.1/
curl -H 'Host: campusbook.top' http://127.0.0.1/
```

结果摘要：

- 返回 `HTTP/1.1 200 OK`
- 返回前端 `index.html`

### 5. 验证前端 www 子域名

```bash
curl -I -H 'Host: www.campusbook.top' http://127.0.0.1/
```

结果摘要：

- 返回 `HTTP/1.1 200 OK`

## 结论

- 单机开发栈已经可以启动
- Nginx 的 `server_name` 分流已按预期工作
- `campusbook.top` 与 `www.campusbook.top` 都命中前端
- `api.campusbook.top` 已命中 API 健康检查接口
- 当前验证的是 HTTP 基线；HTTPS 仍待后续补齐

## 备注

- 本次对 `127.0.0.1:80` 的 HTTP 验证需要使用提权命令，因为普通沙箱无法访问本地监听端口
