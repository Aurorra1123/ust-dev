# APP-012 / APP-013 验证记录

日期：`2026-04-20`

## 范围

- 预约支持同行人
- 预约开始前后 `10` 分钟签到窗口
- 任一参与人签到则预约保持有效
- 全员未签到则自动判定 `no_show` 并释放资源
- 按预约类别累计违约并禁用 `7` 天

## 代码与模型变更

- 新增 Prisma 模型：
  - `ReservationParticipant`
  - `UserReservationRestriction`
- 新增枚举：
  - `ReservationCategory`
- 新增迁移：
  - `apps/api/prisma/migrations/20260420093446_reservation_attendance_and_restrictions`
- 新增预约签到接口：
  - `POST /reservations/:orderId/check-in`
- 新增签到评估队列：
  - `reservation-attendance.constants.ts`
  - `reservation-attendance-queue.service.ts`
  - `reservation-attendance-worker.service.ts`

## 静态校验

已通过：

- `pnpm --filter api typecheck`
- `pnpm --filter api lint`
- `pnpm --filter api build`
- `pnpm --filter api seed:demo`
- `pnpm --filter web typecheck`
- `pnpm --filter web lint`
- `pnpm --filter web build`

## 联调验证

### 1. 同行人可见并可签到

验证方式：

- 使用 `demo@campusbook.top` 创建学术空间预约，并添加同行人 `partner1@campusbook.top`
- 预约开始时间设置为当前时间前 `9` 分 `50` 秒，以便在约 `10` 秒内完成签到窗口判定
- 使用 `partner1@campusbook.top` 查询 `/orders`
- 使用 `partner1@campusbook.top` 调用 `POST /reservations/:orderId/check-in`

验证结果：

- 同行人可在自己的订单列表中看到被邀请预约
- 同行人签到成功，返回示例：

```json
{
  "orderId": "cmo70dqy0001ly1hhxl8v2ks2",
  "participantUserId": "user_demo_partner_one",
  "participantUserEmail": "partner1@campusbook.top",
  "checkedInAt": "2026-04-20T09:44:50.942Z",
  "reservationCategory": "academic_space",
  "checkInOpenAt": "2026-04-20T09:25:00.786Z",
  "checkInCloseAt": "2026-04-20T09:45:00.786Z",
  "orderStatus": "confirmed"
}
```

### 2. 任一参与人签到后，预约保持有效

验证方式：

- 等待签到评估任务在窗口关闭后执行
- 重新读取该预约订单

验证结果：

- 订单状态保持为 `confirmed`
- 为释放测试资源，随后由主持人手动取消该测试预约

### 3. 全员未签到时自动判定爽约并释放资源

验证方式：

- 使用 `partner2@campusbook.top` 连续创建 `3` 次无同行人的学术空间预约
- 每次开始时间同样设置为当前时间前 `9` 分 `50` 秒
- 不执行任何签到，等待签到评估任务触发

验证结果：

- `3` 次预约最终状态均为 `no_show`

```json
{
  "partner2_no_show_statuses": [
    "no_show",
    "no_show",
    "no_show"
  ]
}
```

### 4. 单类别累计违约超过 2 次后禁用 7 天

验证方式：

- 在 `partner2@campusbook.top` 已有 `3` 次学术空间违约后，立即再次提交同类别预约
- 同时直接查询 `UserReservationRestriction`

验证结果：

- 第 `4` 次预约被拦截：

```json
{
  "message": "reservation-category-disabled:partner2@campusbook.top:2026-04-27T09:45:37.335Z",
  "error": "Bad Request",
  "statusCode": 400
}
```

- 数据库中的限制记录为：

```json
{
  "userId": "user_demo_partner_two",
  "category": "ACADEMIC_SPACE",
  "violationCount": 3,
  "bannedUntil": "2026-04-27T09:45:37.335Z"
}
```

## 负载控制

- 运行时联调仅复用本机临时 `api` 和 `worker`
- 验证后已关闭本机联调进程，避免继续占用宿主机内存
- 未执行 Docker 镜像重建
