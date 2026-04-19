# PUX-004 Responsive States And Copy

日期：`2026-04-19`

## 本轮目标

收口产品化阶段剩余的三类问题：

- 核心页面状态设计仍不统一
- 移动端导航和信息密度仍需收口
- 少量文案仍带有技术演示口吻

## 主要改动

### 统一状态面板

新增：

- `StatePanel`

落点文件：

- `apps/web/src/ui/user-experience-kit.tsx`

用途：

- 加载态
- 错误态
- 一般提示态

### 页面状态收口

将核心页面中的纯文本提示替换为结构化状态块，覆盖：

- 学术空间页
- 体育设施页
- 活动页
- 订单页
- 管理页

### 产品文案收口

本轮收掉了这些偏技术化表达：

- `体验账号` 改为更自然的入口描述
- 登录页中关于 token / Cookie 的技术解释
- 首页中的 `演示环境`、`技术说明区`
- 应用壳层中的英文视图标签和偏技术化状态表达

### 移动端细节

在 `AppShell` 中对主导航做了移动端收口：

- 导航改为可横向滚动
- 避免小屏下导航被挤压成多行杂乱布局

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

- `dist/assets/index-B2v9MQh6.js`
- `dist/assets/index-DlTMmolE.css`

## 线上热刷新

继续使用低负载方式将新前端产物同步到 `infra-web-1`：

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

验证：

```bash
curl -s https://campusbook.top | sed -n '1,20p'
```

结果关键片段：

```html
<script type="module" crossorigin src="/assets/index-B2v9MQh6.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-DlTMmolE.css">
```

说明线上站点已切到本轮最新前端产物。

## 结论

`PUX-004` 可以标记为通过。

当前前端已经具备：

- 更统一的加载态、错误态和提示态
- 更收口的移动端导航表现
- 更接近正式产品口吻的前台文案
