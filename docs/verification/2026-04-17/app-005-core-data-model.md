# APP-005 Core Data Model Validation

## 日期

- 2026-04-17 (Asia/Shanghai)

## 验证目标

- 验证 Prisma schema 已覆盖用户、资源、资源单元、活动、订单等核心实体
- 验证存在首轮 migration，并已成功应用到 PostgreSQL
- 验证共享类型已与核心模型边界基本对齐

## 本阶段实现边界

- 核心实体：
  - `User`
  - `Resource`
  - `ResourceUnit`
  - `ResourceGroup`
  - `ResourceGroupItem`
  - `Activity`
  - `ActivityTicket`
  - `Order`
  - `OrderItem`
  - `PaymentRecord`
  - `OrderStatusLog`
- 为后续规则引擎和信用分预留了：
  - `Rule`
  - `ResourceRuleBinding`
  - `UserRuleProfile`
  - `UserCreditLog`
- 本阶段只完成数据模型与 migration，不实现预约冲突写入或活动抢票逻辑

## 验证命令

### 1. 校验和格式化 Prisma schema

```bash
cd apps/api
DATABASE_URL='postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public' pnpm exec prisma format
DATABASE_URL='postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public' pnpm exec prisma validate
```

结果摘要：

```text
The schema at prisma/schema.prisma is valid
```

### 2. 生成并应用首轮 migration

```bash
cd apps/api
DATABASE_URL='postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public' pnpm exec prisma migrate dev --name init_core_models
```

结果摘要：

```text
Applying migration `20260417015325_init_core_models`
Your database is now in sync with your schema.
```

生成文件：

```text
apps/api/prisma/migrations/20260417015325_init_core_models/migration.sql
```

### 3. 查看数据库已落表关系

```bash
docker compose -f infra/docker-compose.yml exec -T postgres \
  psql -U campusbook -d campusbook -c "\dt"
```

结果摘要：

```text
Activity
ActivityTicket
Order
OrderItem
OrderStatusLog
PaymentRecord
Resource
ResourceGroup
ResourceGroupItem
ResourceRuleBinding
ResourceUnit
Rule
User
UserCreditLog
UserRuleProfile
_prisma_migrations
```

### 4. 抽样检查核心表结构

```bash
docker compose -f infra/docker-compose.yml exec -T postgres \
  psql -U campusbook -d campusbook -c '\d "User"'
docker compose -f infra/docker-compose.yml exec -T postgres \
  psql -U campusbook -d campusbook -c '\d "Resource"'
docker compose -f infra/docker-compose.yml exec -T postgres \
  psql -U campusbook -d campusbook -c '\d "Activity"'
docker compose -f infra/docker-compose.yml exec -T postgres \
  psql -U campusbook -d campusbook -c '\d "Order"'
```

结果摘要：

- `User` 已包含 `name`、`email`、`role`、`status`、`creditScore`
- `Resource` 已包含 `type`、`code`、`name`、`status`
- `Activity` 已包含 `title`、`totalQuota`、`saleStartTime`、`saleEndTime`、`status`
- `Order` 已包含 `userId`、`activityId`、`bizType`、`status`、`version`、`expireAt`

### 5. 校验代码侧构建

```bash
pnpm lint
pnpm build
```

结果摘要：

```text
packages/shared-types lint: Done
apps/api lint: Done
apps/web lint: Done

packages/shared-types build: Done
apps/api build: Done
apps/web build: Done
```

## 结论

- `APP-005` 已达到验收条件
- Prisma schema 已覆盖比赛题和 V2 技术方案所需的核心主数据骨架
- 首轮 migration 已真实落到 PostgreSQL，不是只停留在代码层
- 共享类型已补齐核心枚举和实体接口，可支撑后续 API 与前端联调

## 备注

- 当前认证仍是演示账号模式，后续需要把 `AuthService` 逐步切到数据库用户模型
- 预约冲突约束、活动幂等与规则执行将在后续任务中继续实现
