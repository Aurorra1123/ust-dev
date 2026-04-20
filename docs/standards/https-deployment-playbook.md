# HTTPS Deployment Playbook

## 目标

在不改变当前域名分工的前提下，将现有单机 HTTP 编排升级为正式 HTTPS：

- `campusbook.top` / `www.campusbook.top` -> frontend
- `api.campusbook.top` -> backend

## 当前仓库内的 HTTPS 基线

- 基础编排：`infra/docker-compose.yml`
- HTTPS 追加编排：`infra/docker-compose.https.yml`
- HTTP 路由：`infra/nginx/conf.d/campusbook.conf`
- HTTPS 模板：`infra/nginx/https-conf.d/campusbook-https.conf.template`

说明：

- 基础编排继续提供当前 HTTP 联调能力
- 追加 `docker-compose.https.yml` 后，`nginx` 会额外挂载：
  - `443:443`
  - Let’s Encrypt 证书目录
  - 443 配置模板

## 切换前检查

1. 域名解析已经指向 `47.251.174.28`
2. 当前 `80` 端口可从公网访问
3. 当前 HTTP 服务健康：
   - `http://campusbook.top`
   - `http://www.campusbook.top`
   - `http://api.campusbook.top/health`
4. `.env` 中至少满足：
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS` 包含 `http` 与 `https` 的前端域名

## 目录准备

```bash
mkdir -p infra/nginx/.runtime/certbot/www
mkdir -p infra/nginx/.runtime/certbot/conf
```

## 证书申请

建议使用单张证书覆盖这 3 个域名：

- `campusbook.top`
- `www.campusbook.top`
- `api.campusbook.top`

申请命令：

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

- 此时应保持 `nginx` 正在运行，由现有 `80` 端口继续对外提供 challenge 文件
- 因为使用的是 `webroot` 模式，这里不需要额外挂载 `80:80`

申请成功后，证书路径应存在：

```text
infra/nginx/.runtime/certbot/conf/live/campusbook.top/fullchain.pem
infra/nginx/.runtime/certbot/conf/live/campusbook.top/privkey.pem
```

## 启用 HTTPS

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.https.yml up -d nginx
```

如果之前 `web/api/worker` 也有新镜像要一起切换，推荐顺序仍然是：

1. 更新 `api/worker`
2. 验证 `api.campusbook.top/health`
3. 更新 `web`
4. 最后带上 HTTPS override 重启 `nginx`

## 验证命令

```bash
curl -I http://campusbook.top
curl -I https://campusbook.top
curl -I https://www.campusbook.top
curl -i https://api.campusbook.top/health
```

预期：

- HTTP 返回 `301` 到 HTTPS
- 前端页面可正常打开
- API 健康检查返回 `200`

## 回滚

如发现证书、443 或重定向配置异常，可先回滚到纯 HTTP：

```bash
docker compose -f infra/docker-compose.yml up -d nginx
```

回滚后验证：

```bash
curl -i http://api.campusbook.top/health
curl -I http://campusbook.top
```

## 注意事项

- 当前前端 API 默认地址会跟随页面协议推导为 `api.campusbook.top`，避免 HTTPS 页面访问 HTTP API 的 mixed content
- API refresh token Cookie 在 `NODE_ENV=production` 下会自动启用 `secure`
- `nginx` 当前通过 Docker DNS `127.0.0.11` 解析 `web` 和 `api`，可降低容器重建后继续命中旧 upstream 地址的概率
- `infra/nginx/.runtime/` 为运行时目录，不进入 git，也不应手工编辑其中的证书内容

## 证书续期

仓库内提供了续期脚本：

```bash
pnpm tls:renew
```

仅做续期演练时：

```bash
pnpm tls:renew:dry-run
```

脚本位置：

```text
scripts/renew-https-certs.sh
```

脚本行为：

1. 复用 `infra/nginx/.runtime/certbot/` 下的现有证书目录
2. 使用 `certbot/certbot renew --webroot`
3. 成功后对正在运行的 `nginx` 执行轻量 reload

说明：

- 本仓库当前只固化了“可重复执行的续期命令”
- 若要真正自动化，需要在宿主机再补一层 `cron` 或 `systemd timer`
- 推荐低峰期执行一次 `--dry-run`，确认后再挂到定时任务
