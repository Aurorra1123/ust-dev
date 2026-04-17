# APP-006 Academic Reservation Validation

## 日期

- 2026-04-17 (Asia/Shanghai)

## 验证目标

- 验证用户可提交学术空间预约请求
- 验证后端会按预约前后各 `5` 分钟缓冲进行冲突判断
- 验证数据库层存在防重叠约束，而不只是业务层预检查

## 本阶段实现边界

- 新增 `AcademicReservation` 数据模型
- 新增 `POST /reservations/academic`
- 在事务中同时创建：
  - `Order`
  - `OrderItem`
  - `OrderStatusLog`
  - `AcademicReservation`
- 对学术空间资源启用 `PostgreSQL EXCLUDE USING GIST` 排斥约束

## 关键实现

- 资源单元必须属于 `ACADEMIC_SPACE`
- 请求进入后先做应用层冲突检查，减少明显冲突的无效事务
- 数据库侧再通过排斥约束兜底，防止并发下出现重叠写入
- 排斥约束计算的是：
  - `startTime - bufferBeforeMin`
  - `endTime + bufferAfterMin`

## 验证命令

### 1. 生成并应用预约 migration

```bash
cd apps/api
DATABASE_URL='postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public' \
  pnpm exec prisma migrate dev --create-only --name academic_reservation_flow

DATABASE_URL='postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public' \
  pnpm exec prisma migrate dev
```

结果摘要：

```text
Applying migration `20260417020123_academic_reservation_flow`
Your database is now in sync with your schema.
```

### 2. 重建并启动 API

```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d api
```

结果摘要：

```text
Mapped {/reservations/academic, POST} route
PostgreSQL connection established
```

### 3. 准备最小测试资源

```bash
docker compose -f infra/docker-compose.yml exec -T postgres psql -U campusbook -d campusbook -c '
INSERT INTO "Resource" (...) VALUES (...);
INSERT INTO "ResourceUnit" (...) VALUES (...);'
```

结果摘要：

```text
INSERT 0 1
INSERT 0 1
```

### 4. 创建一单正常预约

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"resourceUnitId":"unit_academic_demo","startTime":"2026-04-18T02:00:00.000Z","endTime":"2026-04-18T03:00:00.000Z","userEmail":"demo@campusbook.top"}' \
  http://127.0.0.1/reservations/academic
```

结果摘要：

```json
{
  "reservationId": "...",
  "orderId": "...",
  "orderNo": "...",
  "resourceId": "res_academic_demo",
  "resourceUnitId": "unit_academic_demo",
  "startTime": "2026-04-18T02:00:00.000Z",
  "endTime": "2026-04-18T03:00:00.000Z",
  "bufferBeforeMin": 5,
  "bufferAfterMin": 5,
  "status": "pending_confirmation"
}
```

### 5. 提交一单缓冲区冲突预约

```bash
curl --connect-timeout 3 -sS \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"resourceUnitId":"unit_academic_demo","startTime":"2026-04-18T02:55:00.000Z","endTime":"2026-04-18T03:30:00.000Z","userEmail":"demo@campusbook.top"}' \
  http://127.0.0.1/reservations/academic
```

结果摘要：

```text
HTTP/1.1 409 Conflict
```

```json
{
  "message": "academic-reservation-conflict",
  "error": "Conflict",
  "statusCode": 409
}
```

### 6. 直接用 SQL 验证数据库排斥约束

```bash
docker compose -f infra/docker-compose.yml exec -T postgres psql -v ON_ERROR_STOP=1 \
  -U campusbook -d campusbook -c '
BEGIN;
INSERT INTO "Order" (...);
INSERT INTO "AcademicReservation" (... overlapping buffered range ...);'
```

结果摘要：

```text
ERROR:  conflicting key value violates exclusion constraint "academic_reservation_no_overlap"
DETAIL:  Key (...) conflicts with existing key (...)
```

### 7. 清理测试预约记录

```bash
docker compose -f infra/docker-compose.yml exec -T postgres psql -U campusbook -d campusbook -c '
DELETE FROM "Order" WHERE "id" = ...;
SELECT COUNT(*) AS remaining_reservations FROM "AcademicReservation" WHERE "resourceUnitId" = ''unit_academic_demo'';'
```

结果摘要：

```text
DELETE 1
remaining_reservations = 0
```

## 结论

- `APP-006` 已达到验收条件
- 学术空间预约请求已经可用
- 冲突判断已按前后各 `5` 分钟缓冲执行
- 数据库层排斥约束已能阻止重叠占用，具备并发兜底能力

## 备注

- 当前用于验证的学术空间资源是手工插入的测试数据，后续应由资源管理或 seed 流程统一创建
- 目前前端 `spaces` 页面仍是静态说明页，预约 API 已可用，但尚未做正式表单接入
