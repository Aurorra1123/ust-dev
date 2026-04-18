# SEC-001 验证记录

日期：`2026-04-18`

## 回归样本

- `GET /health` 通过 Nginx 与 `api.campusbook.top` 验证通过
- PostgreSQL 与 Redis 依赖状态均为 `up`

## 验证范围

- 学生与管理员登录均可获得带 `user.id` 的 access token
- 预约写接口不再接受 `userEmail`
- 学术空间预约从 token 上下文绑定用户身份
- 普通用户不能执行管理员订单动作
- 内部任务接口必须携带 `x-internal-job-token`

## 验证结果

1. 学生登录 `demo@campusbook.top` 返回 `200`
2. 管理员登录 `admin@campusbook.top` 返回 `200`
3. 学术空间预约请求携带额外 `userEmail` 字段返回 `400`
4. 不带 `userEmail` 的学术空间预约返回 `201`，响应中的 `userId` 与登录 token 对应用户一致
5. 学生调用 `POST /orders/:id/confirm` 返回 `403 forbidden-role`
6. 管理员调用 `POST /orders/:id/confirm` 返回 `201`，订单状态迁移为 `CONFIRMED`
7. 不带内部任务 token 调用 `POST /orders/jobs/expire-pending` 返回 `401 invalid-internal-job-token`
8. 携带内部任务 token 调用同一接口返回 `201`
9. 验证完成后，学生调用 `POST /orders/:id/cancel` 返回 `201`，订单状态迁移为 `CANCELLED`

## 结论

- `SEC-001` 已实现可信身份上下文与最小权限边界
- 后续 `APP-009` 新增活动报名接口时，应复用同一套 `AccessTokenGuard / RolesGuard / InternalJobGuard` 约束
