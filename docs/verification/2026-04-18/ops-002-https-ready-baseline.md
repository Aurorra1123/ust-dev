# OPS-002 HTTPS Ready Baseline

日期：2026-04-18

## 目标

在不直接切线上 HTTPS 的前提下，把仓库补到可无缝升级 `443` 的状态：

- `campusbook.top` / `www.campusbook.top` -> frontend
- `api.campusbook.top` -> backend

## 新增内容

- `infra/docker-compose.https.yml`
- `infra/nginx/https-conf.d/campusbook-https.conf.template`
- `docs/standards/https-deployment-playbook.md`

同时补齐：

- 前端默认 API 地址跟随页面协议推导
- API refresh token Cookie 在 `NODE_ENV=production` 下启用 `secure`
- `ALLOWED_ORIGINS` 默认值同时覆盖 HTTP 与 HTTPS 前端域名

## 校验命令

### 1. Compose 基础配置

```bash
docker compose -f infra/docker-compose.yml config
```

结果：通过。

### 2. Compose HTTPS 叠加配置

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.https.yml config
```

结果：通过。确认：

- `nginx` 暴露 `443`
- 443 override 会把 `campusbook-https.conf.template` 挂载为 `/etc/nginx/conf.d/campusbook.conf`
- 证书目录挂载到 `/etc/letsencrypt`

### 3. HTTP Nginx 语法校验

```bash
docker run --rm \
  -v /data/ustdev/ust-dev/infra/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /data/ustdev/ust-dev/infra/nginx/.runtime/certbot/www:/var/www/certbot:ro \
  nginx:1.27-alpine nginx -t
```

结果：通过。

### 4. HTTPS Nginx 语法校验

为避免依赖真实证书，本次先在 `/tmp/ops-002-letsencrypt` 生成临时自签证书，再执行：

```bash
docker run --rm \
  -v /data/ustdev/ust-dev/infra/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /data/ustdev/ust-dev/infra/nginx/https-conf.d/campusbook-https.conf.template:/etc/nginx/conf.d/campusbook.conf:ro \
  -v /data/ustdev/ust-dev/infra/nginx/.runtime/certbot/www:/var/www/certbot:ro \
  -v /tmp/ops-002-letsencrypt:/etc/letsencrypt:ro \
  nginx:1.27-alpine nginx -t
```

结果：通过。

## 结论

- 仓库已经具备正式 HTTPS 切换所需的配置基线
- 当前尚未在这次会话中实际申请 Let’s Encrypt 正式证书，也未把线上入口切到 `443`
- 后续按 `https-deployment-playbook.md` 执行证书申请和 `nginx` 重启即可完成正式切换
