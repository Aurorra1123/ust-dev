# APP-007 体育设施预约验证

日期：`2026-04-17`

## 回归样本

- `GET /health`
  - 请求：`curl -H 'Host: api.campusbook.top' http://127.0.0.1/health`
  - 结果：返回 `status=ok`，`postgres=up`，`redis=up`

## 测试数据

- 资源：`res_sports_demo` / `SPORTS-DEMO`
- 单元：
  - `unit_sports_demo_a`
  - `unit_sports_demo_b`
- 组合资源组：`group_sports_demo_pair`

## 验证项

### 1. 单资源槽位预约成功

- 请求：`POST /reservations/sports`
- 输入：
  ```json
  {
    "resourceUnitId": "unit_sports_demo_a",
    "slotStarts": ["2026-04-18T08:00:00.000Z"],
    "userEmail": "sports-single@campusbook.top"
  }
  ```
- 结果：`201 Created`
- 返回关键字段：
  - `orderId = cmo2aqakl0004a9svke1qwius`
  - `resourceUnitIds = ["unit_sports_demo_a"]`
  - `slotCount = 1`

### 2. 同一单元同一槽位重复预约失败

- 请求：再次预约 `unit_sports_demo_a @ 2026-04-18T08:00:00.000Z`
- 结果：`409 Conflict`
- 返回：`sports-reservation-conflict`

### 3. 组合预约成功

- 请求：`POST /reservations/sports`
- 输入：
  ```json
  {
    "resourceGroupId": "group_sports_demo_pair",
    "slotStarts": ["2026-04-18T09:00:00.000Z"],
    "userEmail": "sports-group@campusbook.top"
  }
  ```
- 结果：`201 Created`
- 返回关键字段：
  - `orderId = cmo2aqapm000ea9sv8iccnzgo`
  - `resourceUnitIds = ["unit_sports_demo_a", "unit_sports_demo_b"]`
  - `slotCount = 2`

### 4. 任一单元冲突时组合预约整单失败

- 先单独占用：`unit_sports_demo_a @ 2026-04-18T10:00:00.000Z`
  - 结果：`201 Created`
  - `orderId = cmo2aqarf000qa9svq5s4uguy`
- 再发起组合预约：`group_sports_demo_pair @ 2026-04-18T10:00:00.000Z`
  - 结果：`409 Conflict`
  - 返回：`sports-reservation-conflict`

### 5. 数据库层唯一索引兜底生效

- 直接向 `SportsReservationSlot` 插入与现有有效占用相同的 `resourceUnitId + slotStart`
- 结果：PostgreSQL 拒绝写入
- 错误关键字：`duplicate key value violates unique constraint "sports_active_slot_unique"`

### 6. 清理验证订单后槽位重新释放

- 通过 `/orders/:id/cancel` 取消本轮 3 个测试订单
- 返回结果中对应 `sportsReservationSlots.status` 均变为 `CANCELLED`
- SQL 检查：
  ```sql
  SELECT COUNT(*)
  FROM "SportsReservationSlot"
  WHERE "resourceId" = 'res_sports_demo'
    AND "status" IN ('PENDING_CONFIRMATION', 'CONFIRMED');
  ```
- 结果：`0`

## 结论

- 体育设施已按 `1` 小时离散槽位建模
- 已支持单资源预约与组合预约
- 任一槽位冲突会使整单失败
- 数据库层存在仅针对有效占用的唯一索引兜底，取消后槽位可继续复用
