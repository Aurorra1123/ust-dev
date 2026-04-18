# OPS-002 Live HTTPS Cutover

日期：2026-04-18

## 目标

将当前线上入口从 HTTP 正式切到 HTTPS，并确认：

- 证书签发成功
- `80 -> 443` 跳转生效
- API 健康检查与登录链路在 HTTPS 下正常
- refresh token Cookie 进入 `Secure` 模式

## 实际执行

### 1. ACME challenge 可达性验证

在 `infra/nginx/.runtime/certbot/www/.well-known/acme-challenge/healthcheck.txt` 写入测试文件后，验证：

- `http://campusbook.top/.well-known/acme-challenge/healthcheck.txt`
- `http://www.campusbook.top/.well-known/acme-challenge/healthcheck.txt`
- `http://api.campusbook.top/.well-known/acme-challenge/healthcheck.txt`

结果：三条都成功返回测试内容。

### 2. 正式证书签发

执行：

```bash
docker run --rm \
  -v /data/ustdev/ust-dev/infra/nginx/.runtime/certbot/conf:/etc/letsencrypt \
  -v /data/ustdev/ust-dev/infra/nginx/.runtime/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --non-interactive \
  --agree-tos \
  --email jruan189@connect.hkust-gz.edu.cn \
  --no-eff-email \
  --webroot \
  -w /var/www/certbot \
  -d campusbook.top \
  -d www.campusbook.top \
  -d api.campusbook.top
```

结果：

- 证书签发成功
- 路径：`infra/nginx/.runtime/certbot/conf/live/campusbook.top/`
- 到期时间：`2026-07-17`

### 3. 服务切换

顺序执行：

1. 重载当前 `nginx`，确保 challenge 路径生效
2. 以 `NODE_ENV=production` 重建并拉起 `api/worker`
3. 启用 `infra/docker-compose.https.yml` 拉起 `nginx`
4. 顺序重建 `web`
5. 再次拉起 `web/nginx`

## 验证结果

### HTTP 跳转

```text
HTTP/1.1 301 Moved Permanently
Location: https://campusbook.top/
```

### HTTPS 前端

- `https://campusbook.top` 返回 `200`
- `https://www.campusbook.top` 返回 `200`

### HTTPS API

`https://api.campusbook.top/health` 返回：

```json
{
  "service": "campusbook-api",
  "status": "ok",
  "dependencies": {
    "postgres": "up",
    "redis": "up"
  }
}
```

### Secure Cookie

登录响应头包含：

```text
set-cookie: campusbook_refresh_token=...; HttpOnly; Secure; SameSite=Lax
```

### Smoke 回归

执行：

```bash
pnpm smoke:live
```

结果：

```json
{
  "status": "ok",
  "checkedAt": "2026-04-18T12:07:21.870Z",
  "counts": {
    "academicResources": 1,
    "activities": 3,
    "orders": 7,
    "adminResources": 2,
    "adminActivities": 4,
    "adminRules": 3
  }
}
```

## 结论

- 当前线上已经完成正式 HTTPS 切换
- 三个域名的职责没有变化，仍保持：
  - `campusbook.top` / `www.campusbook.top` -> frontend
  - `api.campusbook.top` -> backend
- 当前剩余运维工作主要是补证书续期自动化
