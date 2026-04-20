# PUX-007 访客可见范围收口验证

日期：`2026-04-20`

## 变更摘要

- 访客导航已收口为统一登录入口，不再暴露学术空间、体育设施、校园活动入口
- 学术空间、体育设施、校园活动、历史记录四类学生端页面已挂到学生门户守卫下
- 未登录访问这些页面时，会被重定向到登录页并保留原始跳转地址
- 管理身份访问学生门户页面时，会被重定向到教师工作台
- 访客首页已收口为简洁登录入口，并新增中英文语言切换底座

## 代码落点

- `apps/web/src/routes.tsx`
- `apps/web/src/ui/route-guards.tsx`
- `apps/web/src/ui/app-shell.tsx`
- `apps/web/src/ui/pages/home-page.tsx`
- `apps/web/src/store/locale-store.ts`
- `apps/web/src/lib/locale.ts`

## 验证

顺序执行，避免对小内存机器造成额外压力：

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

结果：

- `typecheck` 通过
- `lint` 通过
- `build` 通过
- 产物为：
  - `dist/assets/index-DBUOT101.css`
  - `dist/assets/index-DHx9VHwb.js`
- 已以低负载方式热刷新线上 `web` 容器
- `https://campusbook.top` 当前开始返回：
  - `index-DBUOT101.css`
  - `index-DHx9VHwb.js`

## 说明

- 本轮完成的是访客可见范围和访问控制收口
- 双语文案目前只在访客首页和访客壳层完成了切换底座
- 完整的核心页面中英文切换仍归属于 `PUX-008`
