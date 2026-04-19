# PUX-006 Role Based Homepages

日期：`2026-04-19`

## 本轮目标

把首页从“说明型门户页”改成更贴近真实使用场景的角色化首页：

- 未登录用户只看到统一登录入口
- 学生登录后直接看到三类校园服务入口
- 教师或管理身份登录后直接进入工作台

## 主要改动

### 登录后默认跳转

文件：

- `apps/web/src/ui/pages/login-page.tsx`

改动：

- 学生登录后默认跳转到 `/`
- 教师或管理身份登录后默认跳转到 `/admin`
- 若存在显式 `redirect` 参数，仍优先使用该参数

### 首页重写

文件：

- `apps/web/src/ui/pages/home-page.tsx`

改动：

- 首页改为按身份分流
- 未登录用户只看到简洁统一登录入口
- 学生登录后首页改为真实服务首页，保留：
  - 体育空间
  - 校园活动
  - 学术空间
  - 历史记录
  - 近期活动通知栏
- 教师或管理身份访问 `/` 时，直接重定向到 `/admin`

### 顶层导航收口

文件：

- `apps/web/src/ui/app-shell.tsx`

改动：

- 学生端导航收口为：
  - 学生首页
  - 体育空间
  - 校园活动
  - 学术空间
  - 历史记录
- 教师端导航收口为：
  - 教师工作台

### 教师工作台语义收口

文件：

- `apps/web/src/ui/pages/admin-page.tsx`

改动：

- 工作台首页文案改为“教师工作台”语境
- 更强调维护任务、数据更新和工作区入口

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

- `dist/assets/index-BEYhZzb1.js`
- `dist/assets/index-CJKyMaj0.css`

## 线上热刷新

继续采用低负载方式将新的前端产物同步到 `infra-web-1`：

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

验证：

```bash
curl -s https://campusbook.top | sed -n '1,20p'
```

结果关键片段：

```html
<script type="module" crossorigin src="/assets/index-BEYhZzb1.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CJKyMaj0.css">
```

说明线上站点已切到本轮新的角色化首页版本。

## 结论

`PUX-006` 可以标记为通过。

当前首页已经更接近真实产品使用场景：

- 学生登录后直接进入三类服务入口页
- 教师登录后直接进入工作台
- 未登录不再看到大段说明型首页内容
