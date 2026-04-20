# APP-014 / APP-015 验证记录

日期：`2026-04-20`

## 范围

- 管理员资源列表增强
- 周期性资源放号规则
- 资源预约关闭规则
- 资源预约状态查看
- 管理员取消学生预约

## 代码与模型变更

- 新增 Prisma 枚举与模型：
  - `ResourceReleaseFrequency`
  - `ResourceReleaseRule`
  - `ResourceBookingClosure`
- 新增迁移：
  - `apps/api/prisma/migrations/20260420103020_admin_resource_release_and_closure`
- 新增纯计算模块：
  - `apps/api/src/modules/resource/resource-channel.ts`
- 新增管理端资源接口：
  - `POST /admin/resources/release-rules`
  - `PATCH /admin/resources/release-rules/:id`
  - `POST /admin/resources/closures`
  - `PATCH /admin/resources/closures/:id`
  - `GET /admin/resources/:id/reservation-status`

## 静态校验

已通过：

- `pnpm --filter api typecheck`
- `pnpm --filter api lint`
- `pnpm --filter api build`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 联调验证

验证方式：

- 启动本机 `api:3001`
- 使用管理员账号创建一条独立测试资源和单元
- 在该资源上顺序验证放号规则、关闭规则、预约状态查询与管理员取消预约

### 1. 管理员资源列表返回新字段

验证结果：

- `GET /admin/resources` 返回新增字段：
  - `releaseRules`
  - `bookingClosures`
  - `channelStatus`

示例结果：

```json
{
  "releaseRules": 1,
  "bookingClosures": 0,
  "channelStatus": "scheduled"
}
```

### 2. 放号规则会影响学生端预约

验证步骤：

- 为测试资源创建一条每日放号规则，时间设为当前时间后 `1` 小时
- 学生尝试提交学术空间预约

验证结果：

- 预约被正确拦截：

```json
{
  "message": "resource-not-yet-released:运营验证空间 0420185338:2026-04-20T11:53:00.000Z",
  "error": "Bad Request",
  "statusCode": 400
}
```

- 将放号规则调整到当前时间前 `1` 小时后，学生预约成功创建，状态为 `confirmed`

### 3. 关闭规则会影响学生端预约

验证步骤：

- 为测试资源创建一条关闭规则，起始为当前时间后 `30` 分钟，结束为当前时间后 `4` 小时
- 学生尝试提交与该关闭时间段重叠的预约

验证结果：

- 预约被正确拦截：

```json
{
  "message": "resource-booking-closed:运营验证空间 0420185338:2026-04-20T11:23:38.963Z:2026-04-20T14:53:38.963Z",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 4. 资源预约状态查询可反映预约与关闭记录

验证步骤：

- 在成功预约后调用：
  - `GET /admin/resources/:id/reservation-status`
- 再在创建关闭规则后重新查询同一资源状态

验证结果：

- 关闭规则创建前：

```json
{
  "academicReservations": 1,
  "closures": 0
}
```

- 关闭规则创建后：

```json
{
  "academicReservations": 1,
  "closures": 1,
  "channelStatus": "open"
}
```

说明：

- `channelStatus` 表示当前时刻的通道状态
- 关闭规则尚未生效时，当前状态仍然可以是 `open`
- 但对未来时间段的预约会被关闭规则正确拦截

### 5. 管理员可取消学生预约

验证步骤：

- 使用管理员账号调用：
  - `POST /orders/:id/cancel`

验证结果：

- 预约状态变为 `cancelled`

## 负载控制

- 联调只启动了本机单个 `api:3001`
- 未启动本机 worker
- 未重建 Docker 镜像
- 联调完成后已关闭本机 API 进程
