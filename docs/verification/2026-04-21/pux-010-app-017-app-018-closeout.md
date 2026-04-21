# PUX-010 / APP-017 / APP-018 Status Reconciliation

## 本轮代码与运行时收口

已完成以下校验与运行时操作：

1. 生成最新 Prisma Client
   - `pnpm prisma:generate`
2. 仓库级静态校验
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm test`
3. 将新增 migration 应用到本地数据库
   - 由于仓库根目录 `.env` 中的 `DATABASE_URL` 默认指向容器网络主机名 `postgres`
   - 为了从宿主机直接执行 Prisma CLI，本轮将 `DATABASE_URL` 临时替换为同一连接串的 `127.0.0.1` 版本后执行
   - 实际执行：`pnpm --filter api prisma:migrate:deploy`
4. 重写 demo 数据
   - 实际执行：`pnpm --filter api seed:demo`

## 关键结果

- `Notification` 与 `ServiceRequest` migration 已成功应用
- demo seed 已成功写入：
  - `notification_demo_sports_maintenance`
  - `notification_demo_open_day`
  - `notification_demo_draft_workshop`
  - `service_request_demo_screen`
  - `service_request_demo_aircon`
- 本轮修复了 seed 的兼容性问题：
  - 原先通知和工单样例引用了固定 demo 用户主键
  - 当数据库里 demo 用户已提前存在且主键不同，会触发外键失败
  - 当前 seed 已改为先 `upsert` 用户，再引用真实返回的用户 ID

## 当前结论

- 本文件原先的“closeout”判断已被同日后续静态 code review 推翻，当前应视为一次状态纠偏记录
- `PUX-010` 当前仅部分完成：
  - 已完成学生端核心页面双语覆盖补齐
  - 已完成管理员工作台冗余“工作区导航”说明块删除
  - 未完成“取消记录并入我的订单”：
    `OrdersPage` 仍过滤 `cancelled` 订单，且独立取消记录页、路由和导航仍存在
- `APP-017` 当前仅部分完成：
  - 已完成学生首页读取真实通知数据
  - 已完成管理员工作台创建、编辑、发布纯文本通知
  - 未完成“简单图片 + 文字通知”：
    当前通知模型、shared types、API、管理端表单和学生端展示都只有文字链路
- `APP-018` 已形成真实链路：
  - 学生端可提交报修工单并查看自己的记录
  - 管理员工作台可查看并更新工单状态
  - 按当前验收条件可视为通过

## 未覆盖项

- 本次状态纠偏仍然基于静态 code review，没有补浏览器级截图或端到端自动化
- 文档中的运行时记录、migration 应用和 demo seed 成功结论依然有效，但不等于 `PUX-010` 与 `APP-017` 已经满足最新验收口径
