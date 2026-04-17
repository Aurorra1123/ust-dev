# APP-008 Order State Machine Validation

## 日期

- 2026-04-17 (Asia/Shanghai)

## 验证目标

- 验证订单主状态覆盖：
  - `PENDING_CONFIRMATION`
  - `CONFIRMED`
  - `CANCELLED`
  - `NO_SHOW`
- 验证每次状态迁移都会写入 `OrderStatusLog`
- 验证存在超时取消的可执行任务入口

## 本阶段实现边界

- 新增 `OrdersService`
- 新增 `OrdersController`
- 新增状态迁移接口：
  - `POST /orders/:id/confirm`
  - `POST /orders/:id/cancel`
  - `POST /orders/:id/no-show`
- 新增超时取消任务入口：
  - `POST /orders/jobs/expire-pending`
- 状态迁移采用 `status + version` 的 CAS 风格更新
- 学术空间预约订单状态迁移时，会同步更新 `AcademicReservation.status`

## 验证命令

### 1. 重建并启动 API

```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d api
docker compose -f infra/docker-compose.yml logs --tail=80 api
```

结果摘要：

```text
Mapped {/orders/:id/confirm, POST} route
Mapped {/orders/:id/cancel, POST} route
Mapped {/orders/:id/no-show, POST} route
Mapped {/orders/jobs/expire-pending, POST} route
```

### 2. 创建一单预约订单

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"resourceUnitId":"unit_academic_demo","startTime":"2026-04-18T04:00:00.000Z","endTime":"2026-04-18T05:00:00.000Z","userEmail":"demo@campusbook.top"}' \
  http://127.0.0.1/reservations/academic
```

结果摘要：

```json
{
  "orderId": "cmo2a2i9w0004vnnt0vlxvdcp",
  "status": "pending_confirmation"
}
```

### 3. 验证确认与爽约迁移

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"reason":"verification-confirm"}' \
  http://127.0.0.1/orders/cmo2a2i9w0004vnnt0vlxvdcp/confirm

curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"reason":"verification-no-show"}' \
  http://127.0.0.1/orders/cmo2a2i9w0004vnnt0vlxvdcp/no-show
```

结果摘要：

```json
{
  "status": "CONFIRMED",
  "version": 2,
  "academicReservation": {
    "status": "CONFIRMED"
  }
}
```

```json
{
  "status": "NO_SHOW",
  "version": 3,
  "academicReservation": {
    "status": "NO_SHOW"
  },
  "statusLogs": [
    { "toStatus": "PENDING_CONFIRMATION" },
    { "toStatus": "CONFIRMED" },
    { "toStatus": "NO_SHOW" }
  ]
}
```

### 4. 验证超时取消入口

先创建第二笔预约订单：

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"resourceUnitId":"unit_academic_demo","startTime":"2026-04-18T06:00:00.000Z","endTime":"2026-04-18T07:00:00.000Z","userEmail":"demo@campusbook.top"}' \
  http://127.0.0.1/reservations/academic
```

将 `expireAt` 调整到过去：

```bash
docker compose -f infra/docker-compose.yml exec -T postgres \
  psql -U campusbook -d campusbook -c \
  "UPDATE \"Order\" SET \"expireAt\" = CURRENT_TIMESTAMP - INTERVAL '1 minute' WHERE \"id\" = 'cmo2a2wak000lvnntnj0ktocb';"
```

执行超时取消任务入口：

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -X POST \
  http://127.0.0.1/orders/jobs/expire-pending
```

结果摘要：

```json
{
  "processed": 1,
  "results": [
    {
      "orderId": "cmo2a2wak000lvnntnj0ktocb",
      "status": "CANCELLED"
    }
  ]
}
```

拉取订单详情：

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  http://127.0.0.1/orders/cmo2a2wak000lvnntnj0ktocb
```

结果摘要：

```json
{
  "status": "CANCELLED",
  "academicReservation": {
    "status": "CANCELLED"
  },
  "statusLogs": [
    { "toStatus": "PENDING_CONFIRMATION" },
    { "toStatus": "CANCELLED", "reason": "timeout-cancelled" }
  ]
}
```

### 5. 清理测试订单

```bash
docker compose -f infra/docker-compose.yml exec -T postgres psql -U campusbook -d campusbook -c '
DELETE FROM "Order" WHERE "id" IN (...);
SELECT COUNT(*) AS remaining_academic_reservations FROM "AcademicReservation";'
```

结果摘要：

```text
DELETE 2
remaining_academic_reservations = 0
```

## 结论

- `APP-008` 已达到验收条件
- 订单主状态四个枚举都已具备真实流转入口
- 每次状态变更都会写入 `OrderStatusLog`
- 超时取消已具备可执行任务入口
- 学术空间预约订单的状态会与订单状态同步变化

## 备注

- 当前超时取消入口是显式 HTTP 任务入口，后续可接入 BullMQ 或 cron worker
- 自动推远端在当前非交互环境里仍受 askpass 影响，因此本阶段先保证本地提交可用
