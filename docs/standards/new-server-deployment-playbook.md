# New Server Deployment Playbook

## 目标

用当前仓库在一台全新服务器上完成首次部署，并尽快得到可访问的正式站点：

- `campusbook.top`
- `www.campusbook.top`
- `api.campusbook.top`

本文只覆盖最短可执行路径，不扩展为通用运维手册。

## 适用前提

- 新服务器已安装 `git`、`docker`、`docker compose`
- 云平台安全组或防火墙已放行 `80`、`443`
- 上述 3 个域名已解析到新服务器公网 IP
- 仓库部署目录约定为 `/data/ustdev/ust-dev`

如果不使用 `campusbook.top` 这组域名，先修改以下文件后再部署：

- `infra/nginx/conf.d/campusbook.conf`
- `infra/nginx/https-conf.d/campusbook-https.conf.template`
- `apps/web/src/lib/api.ts`
- `.env` 中的 `ALLOWED_ORIGINS`

## 首次部署

### 1. 拉代码

```bash
mkdir -p /data/ustdev
cd /data/ustdev
git clone <你的仓库地址> ust-dev
cd /data/ustdev/ust-dev
```

### 2. 准备环境变量

```bash
cp .env.example .env
```

至少修改以下值：

```dotenv
NODE_ENV=production

POSTGRES_DB=campusbook
POSTGRES_USER=campusbook
POSTGRES_PASSWORD=改成强密码

DATABASE_URL=postgresql://campusbook:和上面相同的强密码@postgres:5432/campusbook?schema=public
REDIS_URL=redis://redis:6379

JWT_ACCESS_SECRET=改成长随机串
JWT_REFRESH_SECRET=改成长随机串
INTERNAL_JOB_TOKEN=改成长随机串

API_PORT=3000
ORDER_PENDING_EXPIRE_SECONDS=900

ALLOWED_ORIGINS=http://campusbook.top,http://www.campusbook.top,https://campusbook.top,https://www.campusbook.top
```

注意：

- `POSTGRES_PASSWORD` 必须与 `DATABASE_URL` 中的密码一致
- `NODE_ENV=production` 不能省略

### 3. 准备 HTTPS 运行时目录

```bash
mkdir -p infra/nginx/.runtime/certbot/www
mkdir -p infra/nginx/.runtime/certbot/conf
```

### 4. 顺序构建镜像

当前项目默认按低内存单机处理，首次部署不要并行构建：

```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml build web
```

### 5. 启动数据库和缓存

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 6. 执行数据库迁移

```bash
docker compose -f infra/docker-compose.yml run --rm api pnpm --filter api prisma:migrate:deploy
```

### 7. 初始化数据

如果需要一套可立即登录验证的演示环境，执行：

```bash
docker compose -f infra/docker-compose.yml run --rm api pnpm --filter api seed:demo
```

如果是正式生产环境且不需要演示账号，可以跳过这一步。

### 8. 启动应用

```bash
docker compose -f infra/docker-compose.yml up -d api worker web nginx
docker compose -f infra/docker-compose.yml ps
```

### 9. 验证 HTTP

```bash
curl -i http://api.campusbook.top/health
curl -I http://campusbook.top
curl -I http://www.campusbook.top
```

如果 DNS 尚未完全生效，可在服务器本机先验证：

```bash
curl -H 'Host: api.campusbook.top' http://127.0.0.1/health
curl -I -H 'Host: campusbook.top' http://127.0.0.1/
curl -I -H 'Host: www.campusbook.top' http://127.0.0.1/
```

### 10. 申请 HTTPS 证书

确认第 9 步已经通过后，再申请证书：

```bash
docker run --rm \
  -v /data/ustdev/ust-dev/infra/nginx/.runtime/certbot/conf:/etc/letsencrypt \
  -v /data/ustdev/ust-dev/infra/nginx/.runtime/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d campusbook.top \
  -d www.campusbook.top \
  -d api.campusbook.top
```

说明：

- 这里不需要额外挂载 `80:80`
- `nginx` 必须保持运行，由它继续响应 `/.well-known/acme-challenge/`

### 11. 启用 HTTPS

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.https.yml up -d nginx
```

### 12. 验证 HTTPS

```bash
curl -I https://campusbook.top
curl -I https://www.campusbook.top
curl -i https://api.campusbook.top/health
```

预期：

- 前端域名返回 `200`
- API 健康检查返回 `200`
- HTTP 自动跳转到 HTTPS

## 后续更新

后续更新代码时，按以下顺序执行：

```bash
cd /data/ustdev/ust-dev
git pull

docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml run --rm api pnpm --filter api prisma:migrate:deploy
docker compose -f infra/docker-compose.yml up -d api worker

docker compose -f infra/docker-compose.yml build web
docker compose -f infra/docker-compose.yml up -d web

docker compose -f infra/docker-compose.yml restart nginx
```

## 常见问题

### 1. `api` 容器启动失败

先检查 `.env` 中以下值是否为空或不一致：

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_JOB_TOKEN`
- `ALLOWED_ORIGINS`

### 2. 页面能打开但接口失败

优先检查：

- `api.campusbook.top` 是否已解析到新服务器
- `.env` 中 `ALLOWED_ORIGINS` 是否包含当前前端域名
- HTTPS 是否已启用，但 API 仍被浏览器拦截为混合内容

### 3. 证书申请失败

优先检查：

- `80` 端口是否对公网开放
- 域名解析是否已生效
- `nginx` 是否仍在运行
- `http://campusbook.top/.well-known/acme-challenge/` 是否可被访问
