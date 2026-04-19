# PUX-002 Live Web Hot Refresh

日期：`2026-04-19`

## 背景

用户端产品化第二轮源码已完成并通过本地校验，但线上站点仍在返回旧的前端资源，因此用户直接访问 `campusbook.top` 时看不到最新页面。

考虑到当前服务器为 `2C2G` 且无 swap，本轮没有使用 `docker compose build web` 做正式镜像重建，而是采用低负载热刷新方式，把本地已构建通过的静态产物同步到正在运行的 `web` 容器。

## 执行方式

执行命令：

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

说明：

- 本机 `apps/web/dist` 已由 `pnpm --filter web build` 生成并验证通过
- `infra-web-1` 使用 `nginx:1.27-alpine` 承载静态资源
- 该方式可以快速让线上页面切到最新前端，但不等于正式镜像重建

## 验证

### 线上首页 HTML

```bash
curl -s https://campusbook.top | sed -n '1,40p'
```

结果关键片段：

```html
<script type="module" crossorigin src="/assets/index-D0P-THWd.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-ZefzWJZj.css">
```

说明线上首页已切到本轮新构建产物。

### 线上 JS 资源

```bash
curl -s https://campusbook.top/assets/index-D0P-THWd.js
```

结果中已可命中本轮新增内容，例如：

- `今日服务总览`
- `一套账号，一处入口`
- `当前选择`
- `统一订单中心`

### 刷新前后负载

执行前后 `uptime` 均保持在低负载区间，未触发新的高峰。

## 结论

本轮已经让 `campusbook.top` 实际显示最新前端产品化页面。

但需要明确：

- 这次是低负载热刷新
- 不是正式镜像级部署
- 若未来重新创建 `web` 容器，仍需做一次正式的 `web` 镜像重建与部署收口
