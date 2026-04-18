# PUX-001 Verification

## 范围

本次验证覆盖产品化第一阶段：

- 固化产品化方案
- 建立校方品牌色驱动的前端视觉基线
- 重构 AppShell、首页、登录页与管理首页
- 收口错误态颜色语义

## 品牌色依据

参考港科大（广州）官网公开主题 CSS，提取到的稳定主色包括：

- `#002F6B`
- `#1D4F92`
- `#A88337`
- `#C8B388`

本轮前端已按这组色板重建 `tailwind` 颜色和全局样式基线。

## 本次主要改动

- 新增 `docs/architecture/productization-plan-v1.md`
- `AppShell` 改为正式校方门户壳层
- `PageHero` / `PageSection` 改为统一设计系统区块
- 首页改为服务门户结构
- 登录页改为统一身份入口
- 管理首页增加运营概览卡片
- 用户端若干页面的错误态统一切到 `danger`

## 轻量验证

执行：

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
git diff --check
```

结果：

- `typecheck` 通过
- `lint` 通过
- `build` 通过
- `git diff --check` 通过

## 结果

- 产品化阶段已正式开始
- `PUX-001` 可标记为通过
- 当前站点的视觉基线已从“工程演示壳层”切换到“校方产品门户基线”
