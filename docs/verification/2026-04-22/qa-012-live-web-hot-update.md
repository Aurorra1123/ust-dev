# QA-012 Live Web Hot Update

日期：`2026-04-22`

## 结论

线上网页端在更新前落后于当前仓库前端产物；本轮已通过低负载热刷新方式，将 `campusbook.top` 与 `www.campusbook.top` 切到当前最新静态资源。

## 更新前核对

本地当前前端构建产物：

```html
<script type="module" crossorigin src="/assets/index-vV6iQsm-.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CY4dAcFM.css">
```

线上更新前首页返回：

```html
<script type="module" crossorigin src="/assets/index-euDLdD1b.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CY4dAcFM.css">
```

说明线上 JS bundle 落后于当前本地构建结果。

## 执行方式

为避免在 `2C2G` 机器上重建整套镜像，本轮采用低负载热刷新：

1. 备份当前 `web` 容器静态目录：

```bash
docker cp infra-web-1:/usr/share/nginx/html /tmp/infra-web-html-backup-20260422-1
```

2. 将本地已构建静态资源覆盖到运行中的 `web` 容器：

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

## 验证

### 前端首页

`https://campusbook.top` 当前返回：

```html
<script type="module" crossorigin src="/assets/index-vV6iQsm-.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CY4dAcFM.css">
```

`https://www.campusbook.top` 当前返回：

```html
<script type="module" crossorigin src="/assets/index-vV6iQsm-.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CY4dAcFM.css">
```

### API 健康检查

`https://api.campusbook.top/health` 当前返回：

```json
{
  "service": "campusbook-api",
  "status": "ok"
}
```

## 影响范围

- 仅更新线上 `web` 静态资源
- 未重建 `api / worker / nginx / postgres / redis`
- 可通过 `/tmp/infra-web-html-backup-20260422-1` 回滚到更新前静态目录
