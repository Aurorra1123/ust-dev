# Domain Model Baseline

## 目标

本文件提供当前系统领域模型的稳定阅读入口，帮助新会话在不直接翻阅全部 `reference` 的情况下理解数据边界。

执行层的最终权威仍然是：

- `apps/api/prisma/schema.prisma`
- 对应 `prisma/migrations/`

本文件负责解释，不替代 schema。

## 领域分层

### 用户与身份

- `User`
  - 统一承载学生和管理员身份
  - 关键字段：
    - `role`
    - `status`
    - `creditScore`
    - `email`
- `UserCreditLog`
  - 记录信用分增减
- `UserRuleProfile`
  - 为规则引擎提供用户维度补充配置

### 资源预约

- `Resource`
  - 资源聚合根，区分：
    - `ACADEMIC_SPACE`
    - `SPORTS_FACILITY`
- `ResourceUnit`
  - 可直接占用的原子资源单元
- `ResourceGroup`
  - 体育设施的组合资源
- `ResourceGroupItem`
  - 组合与资源单元的关联
- `AcademicReservation`
  - 学术空间连续时间段预约
- `SportsReservationSlot`
  - 体育设施离散槽位占用

### 活动与票务

- `Activity`
  - 活动主体
- `ActivityTicket`
  - 活动票种与库存
- `ActivityRegistration`
  - 用户对活动的有效报名记录

### 订单与支付

- `Order`
  - 统一订单聚合根
- `OrderItem`
  - 订单明细，兼容资源预约和活动票
- `OrderStatusLog`
  - 订单状态迁移日志
- `PaymentRecord`
  - 支付记录与幽灵支付保护基础

### 规则系统

- `Rule`
  - 规则定义
- `ResourceRuleBinding`
  - 资源与规则绑定关系
- `UserRuleProfile`
  - 用户规则画像

## 当前关键枚举

- `UserRole`：`STUDENT` / `ADMIN`
- `ResourceType`：`ACADEMIC_SPACE` / `SPORTS_FACILITY`
- `ActivityStatus`：`DRAFT` / `PUBLISHED` / `CLOSED` / `CANCELLED`
- `OrderStatus`：`PENDING_CONFIRMATION` / `CONFIRMED` / `CANCELLED` / `NO_SHOW`
- `OrderBizType`：`RESOURCE_RESERVATION` / `ACTIVITY_REGISTRATION`

## 关键约束

### 身份与权限

- 用户与管理员共用一张 `User` 表
- 写接口身份来源应来自 token 上下文，而不是请求体字段

### 学术空间

- `AcademicReservation` 与 `Order` 一对一
- 使用连续时间段建模
- 实际冲突区间包含前后各 `5` 分钟缓冲
- 数据库层存在防重叠兜底约束

### 体育设施

- `SportsReservationSlot` 与 `Order` 为一对多
- 采用离散槽位建模
- 仅对有效占用建立唯一性约束
- 组合预约要求整单全部成功

### 活动抢票

- `ActivityRegistration` 记录同用户同活动的有效报名
- 数据库层存在同用户唯一性约束
- `ActivityTicket.reserved <= stock` 是最终库存兜底的一部分

### 订单状态机

- 订单所有主业务都收敛到 `Order`
- 关键迁移写入 `OrderStatusLog`
- `version` 用于状态 CAS，减少并发错误覆盖

## 与代码的关系

阅读顺序建议为：

1. 本文件
2. `docs/standards/business-rules-baseline.md`
3. `apps/api/prisma/schema.prisma`
4. 对应业务模块实现

如果 schema 与本文件不一致，应优先修正文档，而不是让 agent 继续依赖过时描述。
