# PUX-008 中英文切换验证

日期：`2026-04-20`

## 变更摘要

- 将语言切换从访客首页扩展到核心入口页面
- 当前已覆盖：
  - 顶层导航与壳层状态区
  - 登录页
  - 学生首页
  - 教师工作台首页
- 语言状态通过 `localStorage` 持久化，键为 `campusbook.locale`

## 代码落点

- `apps/web/src/store/locale-store.ts`
- `apps/web/src/lib/locale.ts`
- `apps/web/src/ui/app-shell.tsx`
- `apps/web/src/ui/pages/login-page.tsx`
- `apps/web/src/ui/pages/home-page.tsx`
- `apps/web/src/ui/pages/admin-page.tsx`

## 验证

顺序执行：

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
  - `dist/assets/index-CGgUna4x.css`
  - `dist/assets/index-CA0gmNMI.js`
- 已以低负载方式热刷新线上 `web` 容器
- `https://campusbook.top` 当前开始返回：
  - `index-CGgUna4x.css`
  - `index-CA0gmNMI.js`

## 本轮完成范围

- 首页保留清晰可见的 `中文 / English` 切换入口
- 顶层壳层增加全局语言切换入口
- 核心导航会随语言切换更新
- 登录入口、学生首页、教师工作台首页的标题、说明、主要按钮和核心状态块已接入双语

## 说明

- 当前优先覆盖的是“高频入口”和“首页级页面”
- 更深层的资源页、活动页、订单页和后台表单细节文案仍可在后续迭代继续扩展
