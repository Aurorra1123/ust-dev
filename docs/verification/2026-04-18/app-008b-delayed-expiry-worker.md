# APP-008B 验证记录

日期：`2026-04-18`

## 回归样本

- `GET /health` 继续返回 `status=ok`
- `POST /auth/login` 学生账号仍可正常签发 access token

## 验证范围

- 待确认订单创建后会自动写入延迟取消任务
- 独立 worker 能消费到期任务并自动取消订单
- 超时取消不再依赖手动调用 `POST /orders/jobs/expire-pending`
- 迟到的确认请求会被状态机拒绝

## 验证方式

- 为了避免再次触发单机 `2C2G` 服务器的高负载重建，本轮集成验证使用本机 `ts-node` 启动临时 API 与临时 worker，直接连接当前 PostgreSQL / Redis
- 本轮临时将 `ORDER_PENDING_EXPIRE_SECONDS=5`

## 验证结果

1. 学生与管理员登录均返回 `200`
2. 学术空间预约创建返回 `201`，订单初始状态为 `PENDING_CONFIRMATION`
3. 等待 `8` 秒后再次读取订单，状态自动迁移为 `CANCELLED`
4. 管理员在订单已自动取消后调用 `POST /orders/:id/confirm`，返回 `400 invalid-order-transition:CANCELLED->CONFIRMED`
5. worker 启动后能正常完成 pending 订单重建扫描，不再依赖人工触发超时取消

## 结论

- `APP-008B` 已满足当前验收口径
- 订单超时取消已经具备队列化与独立 worker 基线
- 后续 `APP-009` 做活动抢票时，可直接复用 BullMQ 队列与 worker 进程模式
