# QA-016 Cyclomatic Batch 3 Backend Services

## 范围

本轮完成圈复杂度治理第三批，聚焦后端核心服务函数：

- `apps/api/src/modules/activities/activities.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/reservation/reservation.service.ts`

## 主要拆分

- `normalizeActivityTimeline`
  - 拆成日期解析、日期合法性检查、售卖时间线检查、活动时间线检查
- `OrdersService.transitionOrder`
  - 拆成：
    - 加载待迁移订单
    - 权限检查
    - 状态迁移合法性检查
    - 事务内 CAS 更新
    - 子记录同步
    - 过期队列、签到队列、活动库存缓存副作用同步
- `ReservationService.createSportsReservation`
  - 拆成：
    - 目标解析
    - 资源与单元校验
    - 冲突检查
    - 事务建单
    - 响应组装

## 影响

- 本轮只做函数拆分和职责下沉，不改变接口参数、错误码口径和事务边界
- 订单状态机、体育预约冲突拦截和活动时间线校验语义保持不变

## 验证

已执行：

```bash
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
```

结果：

- `lint` 通过
- `typecheck` 通过
- `apps/api` 全量测试通过
- 测试结果：`26 tests / 7 suites / 0 fail`
