# APP-011 验证记录

日期：`2026-04-18`

## 验证范围

- 前端登录页、学术空间页、体育设施页、活动页、我的订单页
- 管理端资源维护、活动维护与规则快照页面
- 前端会话恢复、路由守卫与真实 API 接线
- 为前端补充的最小后端支撑接口：
  - `GET /orders`
  - `GET /admin/resources`
  - `GET /admin/activities`

## 主要改动

- 前端新增真实会话状态管理：
  - `accessToken`
  - `user`
  - `authenticated / anonymous / unknown`
- 前端新增真实 API 客户端，覆盖：
  - `auth`
  - `resources`
  - `reservations`
  - `activities`
  - `orders`
  - `admin/resources`
  - `admin/activities`
  - `admin/rules`
- 新增页面：
  - `LoginPage`
  - `OrdersPage`
- 原有页面已从静态说明页升级为真实数据页：
  - `SpacesPage`
  - `SportsPage`
  - `ActivitiesPage`
  - `AdminPage`
- 新增路由守卫：
  - `PublicOnlyRoute`
  - `RequireAuth`
  - `RequireAdmin`

## 验证环境

- 为避免单机 `2C2G` 机器在镜像构建时过载，本轮未重建 compose 镜像
- 静态校验直接针对源码工作区执行
- API smoke 使用本机临时源码进程：
  - `API_PORT=3001 pnpm --filter api exec ts-node --project tsconfig.json --transpile-only src/main.ts`
- PostgreSQL / Redis 复用当前 compose 常驻容器
- 验证完成后已主动关闭本机 `3001` API 进程

## 静态校验

执行：

- `pnpm --filter web typecheck`
- `pnpm --filter web build`
- `pnpm --filter web lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api lint`

结果：均通过

## API Smoke

### 1. 学生登录后可读取用户端核心数据

- 登录账号：`demo@campusbook.top`
- 访问接口：
  - `GET /resources?type=academic_space`
  - `GET /activities`
  - `GET /orders`
- 结果：
  - `role=student`
  - `academic_resources=1`
  - `activities=3`
  - `orders=6`

### 2. 管理员登录后可读取管理端核心数据

- 登录账号：`admin@campusbook.top`
- 访问接口：
  - `GET /admin/resources`
  - `GET /admin/activities`
  - `GET /admin/rules`
- 结果：
  - `role=admin`
  - `admin_resources=2`
  - `admin_activities=4`
  - `admin_rules=3`

## 结论

- `APP-011` 已具备最小可演示前端闭环：
  - 登录
  - 用户预约
  - 活动浏览与抢票入口
  - 我的订单
  - 管理端资源/活动维护
- 前端页面已经接通真实 API 与 demo seed 数据，并按普通用户 / 管理员区分能力
- 当前 `api.campusbook.top` 与 `campusbook.top` 的 compose 容器仍运行旧镜像；若要让域名直接反映本轮最新前端与后端代码，需要后续单独执行一次低频部署更新
