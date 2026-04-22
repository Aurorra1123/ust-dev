# QA-013 Remove Duplicate Login Entry

日期：`2026-04-22`

## 结论

首页与登录页顶部的重复登录入口来自共享壳层，而不是登录页本身。

未登录状态下，顶部原本同时存在：

- 导航中的“登录入口”
- 右上角“登录”主按钮

本轮已收口为仅保留右上角主按钮。

## 根因定位

问题位于：

- `apps/web/src/ui/app-shell.tsx`

在匿名态下：

- `navigationItems` 返回了 `/login`
- 头部右侧操作区也额外渲染了 `/login` 按钮

因此首页与登录页顶部会出现两个登录入口。

## 修复

本轮只做最小改动：

- 匿名态 `navigationItems` 改为空数组
- 当顶部导航为空时，不再渲染导航容器
- 保留右上角登录按钮作为唯一主入口

## 校验

已执行：

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 线上更新

为避免重建整套容器，本轮采用低负载热更新：

1. 备份当前静态资源：

```bash
docker cp infra-web-1:/usr/share/nginx/html /tmp/infra-web-html-backup-20260422-2
```

2. 覆盖线上 `web` 容器静态资源：

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

## 验证

`https://campusbook.top` 当前返回：

```html
<script type="module" crossorigin src="/assets/index-Cx2yqS3m.js"></script>
```

`https://api.campusbook.top/health` 当前继续返回：

```json
{
  "service": "campusbook-api",
  "status": "ok"
}
```
