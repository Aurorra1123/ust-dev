# PUX-003 Admin Workspace

日期：`2026-04-19`

## 本轮目标

将管理端从“长表单 + 列表堆叠”的操作页，重构为更接近正式后台工作台的结构。

本轮重点不是新增接口，而是重做：

- 工作区导航
- 总览层
- 资源维护区
- 活动维护区
- 规则快照区

## 主要改动

### 管理端整体结构

- 在 `apps/web/src/ui/pages/admin-page.tsx` 中新增工作区切换：
  - `overview`
  - `resources`
  - `activities`
  - `rules`
- 当前后台不再要求管理员在一张长页面中查找表单，而是先切换到对应工作区再操作

### 运营总览

- 新增总览视图
- 展示资源、活动、规则的基础规模
- 展示当前选中资源、活动和规则概况
- 增加快速入口卡片，用于跳转到资源、活动和规则工作区

### 资源工作区

- 强化资源列表选中态
- 新增当前资源结构摘要
- 保留“新增资源”和“新增资源单元”两块操作区，但分层更清晰

### 活动工作区

- 强化活动列表选中态
- 新增当前活动详情头部
- 新增票种概览
- 保留“新增活动”和“活动加票/状态切换”两块操作区，但分层更清晰

### 规则工作区

- 将规则从普通列表改为规则卡片
- 新增规则概况摘要
- 新增规则说明区，帮助管理员理解当前规则快照的用途

## 本地验证

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

本轮构建产物：

- `dist/assets/index-YDyVfSEP.js`
- `dist/assets/index-CKlQi4FL.css`

## 线上热刷新

为避免在 `2C2G` 服务器上重复执行高负载镜像构建，本轮沿用低负载方式将新的前端产物同步到运行中的 `infra-web-1`：

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

验证：

```bash
curl -s https://campusbook.top | sed -n '1,20p'
```

结果关键片段：

```html
<script type="module" crossorigin src="/assets/index-YDyVfSEP.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CKlQi4FL.css">
```

说明线上站点已切到包含本轮管理端改造的新前端产物。

## 结论

`PUX-003` 当前可以标记为通过。

当前管理端已具备：

- 统一后台导航与工作区布局
- 资源、活动、规则三类维护区的清晰层级
- 比此前明显更接近正式后台，而不是接口操作面板
