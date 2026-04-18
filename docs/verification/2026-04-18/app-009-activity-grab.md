# APP-009 验证记录

日期：`2026-04-18`

## 验证范围

- 活动抢票入口 `POST /activities/:id/grab`
- 活动报名状态查询 `GET /activities/:id/registration-status`
- Redis 预扣库存
- BullMQ 异步建单
- 同用户同活动唯一性
- 售罄快速失败
- 已确认活动订单取消后的库存释放

## 验证环境

- PostgreSQL / Redis 复用当前 compose 常驻容器
- 代码验证使用本机临时进程：
  - `API_PORT=3001 pnpm --filter api exec ts-node --project tsconfig.json --transpile-only src/main.ts`
  - `pnpm --filter api exec ts-node --project tsconfig.json --transpile-only src/worker.ts`
- 未进行新的 Docker 镜像重建，以避免在 `2C2G` 机器上触发高负载

## 回归

- `GET http://127.0.0.1:3001/health`
- 结果：`status=ok`，`postgres=up`，`redis=up`

## 验证步骤与结果

### 1. 管理员创建 `stock=1` 的已发布测试活动

- 接口：`POST /admin/activities`
- 结果：成功创建活动 `APP009 Smoke Event`
- 活动 ID：`cmo3z0q5e00041441ypv0tmf2`
- 票种 ID：`cmo3z0q5e0005144167rf5vtc`

### 2. 学生抢票请求入队

- 接口：`POST /activities/cmo3z0q5e00041441ypv0tmf2/grab`
- 结果：
  - 返回 `200`
  - `requestStatus=queued`
  - 返回稳定 `jobId`

### 3. 学生报名状态查询变为已确认

- 接口：`GET /activities/cmo3z0q5e00041441ypv0tmf2/registration-status`
- 结果：
  - 返回 `confirmed`
  - 返回真实 `orderId` / `orderNo`

### 4. 同一学生重复报名被拦截

- 再次请求同一活动同一票种
- 结果：
  - 返回 `409`
  - 报错 `activity-already-registered`

### 5. 另一用户在库存耗尽时快速失败

- 管理员使用普通用户态能力请求同一票种
- 结果：
  - 返回 `409`
  - 报错 `activity-sold-out`

### 6. 已确认活动订单取消后释放库存

- 接口：`POST /orders/cmo3z0uhx0003oqcz02fh3f6r/cancel`
- 结果：
  - 订单状态变为 `CANCELLED`
  - `activityRegistration.status` 同步变为 `CANCELLED`
  - 状态日志新增 `CONFIRMED -> CANCELLED`

### 7. 库存释放后另一用户可再次抢票

- 管理员再次请求同一 `stock=1` 票种
- 结果：
  - 抢票请求返回 `queued`
  - 状态查询返回 `confirmed`

### 8. 修复 Redis lazy-connect 边界后再次验证 worker 成功消费

- 新建第二个测试活动 `APP009 Redis Fix Event`
- 活动 ID：`cmo3zbvlp000129xzqycngwu2`
- 票种 ID：`cmo3zbvlp000229xz7jzfap7x`
- 学生抢票后：
  - `/activities/:id/grab` 返回 `queued`
  - `/activities/:id/registration-status` 返回 `confirmed`
  - worker 日志出现 `Processed activity registration job ... confirmed`
  - 未再出现 `Stream isn't writeable and enableOfflineQueue options is false`

## 结论

- `APP-009` 已具备活动抢票基础闭环
- 抢票请求已先走 Redis 预扣，再走 BullMQ worker 异步建单
- 数据库已通过活动报名唯一索引与 `reserved < stock` 条件更新做最终兜底
- 已确认活动订单取消后，票种库存和 Redis 缓存可回写释放
