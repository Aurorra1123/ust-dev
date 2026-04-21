# PUX-010 / APP-017 / APP-018 Closeout

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

- `PUX-010` 的代码级目标已落地：
  - 学生端核心页面双语覆盖补齐
  - “我的订单”不再重复展示已取消历史
  - 管理员工作台冗余“工作区导航”说明块已删除
- `APP-017` 已形成真实链路：
  - 学生首页读取真实通知数据
  - 管理员工作台可创建、编辑、发布通知
- `APP-018` 已形成真实链路：
  - 学生端可提交通知工单并查看自己的记录
  - 管理员工作台可查看并更新工单状态

## 未覆盖项

- 本轮没有补浏览器级截图或端到端自动化
- 本轮“通过”结论基于代码实现、静态校验、构建成功、migration 成功和 demo seed 成功，不等于已经补完浏览器回归证据
