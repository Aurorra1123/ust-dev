# Architecture Diagrams

本文件不再描述“推荐方案”，而是以当前仓库代码为准，汇总 2026-04-21 核对后的真实架构图与业务流程图。

核对范围主要来自：

- `apps/api/src/app.module.ts`
- `apps/api/src/worker.module.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/reservation/`
- `apps/api/src/modules/activities/`
- `apps/api/src/modules/orders/`
- `apps/api/src/modules/rules/`
- `apps/web/src/routes.tsx`
- `apps/web/src/ui/pages/`
- `infra/docker-compose.yml`
- `infra/nginx/conf.d/campusbook.conf`

## 1. 当前运行时架构

```mermaid
flowchart TB
    Browser[学生/管理员浏览器]

    subgraph Host[单机 Docker Compose 部署]
        Nginx[Nginx]
        Web[web 容器\nReact/Vite 静态站点]
        API[api 容器\nNestJS]
        Worker[worker 容器\nBullMQ Workers]
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    Browser -->|campusbook.top / www.campusbook.top| Nginx
    Browser -->|api.campusbook.top| Nginx
    Nginx -->|静态文件与 SPA 路由| Web
    Nginx -->|反代 API| API
    Browser -.->|Bearer access token\nHttpOnly refresh cookie| API
    API --> PG
    API --> Redis
    Worker --> PG
    Worker --> Redis
```

说明：

- 前端与后台管理端共用同一个 SPA，管理员通过 `/admin` 进入工作台。
- 当前部署拓扑中 `worker` 与 `api` 为分离容器，异步任务不在 API 进程内消费。
- Nginx 只做域名分流和反向代理，业务逻辑全部落在 API 与 Worker。

## 2. 当前前端真实业务入口

```mermaid
flowchart TD
    Login[登录页 /login]
    Home[首页 /]
    Spaces[学术空间 /spaces]
    Sports[体育馆 /sports]
    Activities[校园活动 /activities]
    Orders[我的订单 /orders]
    OrderDetail[订单详情 /orders/:orderId]
    QueueStatus[报名状态轮询]
    CheckIn[预约签到]
    Cancel[取消订单]
    Admin[教师工作台 /admin]

    Login -->|POST /auth/login 或 /auth/refresh| Home
    Home --> Spaces
    Home --> Sports
    Home --> Activities
    Home --> Orders
    Home -->|管理员自动跳转| Admin

    Spaces -->|POST /reservations/academic| OrderDetail
    Sports -->|GET /resources/:id/reservation-status| Sports
    Sports -->|POST /reservations/sports| OrderDetail
    Activities -->|POST /activities/:id/grab| QueueStatus
    QueueStatus -->|GET /activities/:id/registration-status| QueueStatus
    QueueStatus -->|confirmed| OrderDetail
    QueueStatus -->|failed| Activities

    Orders --> OrderDetail
    OrderDetail --> CheckIn
    OrderDetail --> Cancel
```

说明：

- 学术空间页当前直接提交预约，不展示公共占用时间表。
- 体育页会先读取公开预约状态，再提交单场地或组合预约。
- 活动页不是同步下单成功，而是先进入排队状态，再轮询报名结果。

## 3. 学术空间预约真实时序

```mermaid
sequenceDiagram
    participant FE as 前端 /spaces
    participant API as ReservationController
    participant Service as ReservationService
    participant Rule as RulesService
    participant DB as PostgreSQL
    participant Queue as reservation-attendance

    FE->>API: POST /reservations/academic
    API->>Service: createAcademicReservation()
    Service->>DB: 校验用户、同行人、资源单元、发布规则、闭馆规则
    Service->>Rule: assertReservationRules(resourceId, userId, duration)
    Rule-->>Service: 通过或拒绝
    Service->>DB: 预查重叠预约
    alt 已存在有效冲突
        DB-->>Service: findFirst hit
        Service-->>FE: 409 academic-reservation-conflict
    else 可继续
        Service->>DB: 事务创建 Order(CONFIRMED)
        Service->>DB: 事务创建 OrderItem
        Service->>DB: 事务创建 AcademicReservation(CONFIRMED)
        Service->>DB: 事务创建 ReservationParticipant
        DB-->>Service: 提交成功
        Service->>Queue: scheduleAttendanceEvaluation(orderId, startTime+10min)
        Service-->>FE: reservationId + orderId + status=confirmed
    end
```

当前实现关键点：

- 学术预约不是先进入待支付，而是建单后直接 `CONFIRMED`。
- 业务层先做一次冲突预检，数据库层再由 `academic_reservation_no_overlap` 排斥约束兜底。
- 冲突范围使用 `startTime/endTime` 加前后各 `5` 分钟缓冲。

## 4. 体育设施预约真实时序

```mermaid
sequenceDiagram
    participant FE as 前端 /sports
    participant Status as ResourceStatusService
    participant API as ReservationController
    participant Service as ReservationService
    participant Rule as RulesService
    participant DB as PostgreSQL
    participant Queue as reservation-attendance

    FE->>Status: GET /resources/:id/reservation-status
    Status-->>FE: 匿名占用状态 + 发布规则 + 闭馆状态
    FE->>API: POST /reservations/sports
    API->>Service: createSportsReservation()
    Service->>Service: 校验单场地或组合场地二选一
    Service->>Service: 归一化 1 小时整点槽位
    Service->>Rule: assertReservationRules(resourceId, userId, slotCount*60)
    Rule-->>Service: 通过或拒绝
    Service->>DB: 预查目标 unit + slotStart 是否冲突
    alt 任一槽位冲突
        DB-->>Service: findFirst hit
        Service-->>FE: 409 sports-reservation-conflict
    else 可继续
        Service->>DB: 事务创建 Order(CONFIRMED)
        Service->>DB: 事务批量创建 OrderItem
        Service->>DB: 事务写入 OrderStatusLog
        Service->>DB: 事务批量创建 SportsReservationSlot(CONFIRMED)
        Service->>DB: 事务创建 ReservationParticipant
        DB-->>Service: 提交成功
        Service->>Queue: scheduleAttendanceEvaluation(firstSlotStart+10min)
        Service-->>FE: orderId + resourceUnitIds + slotStarts + status=confirmed
    end
```

当前实现关键点：

- 组合预约在同一事务内批量写入，任一槽位失败会整单回滚。
- 数据库层由部分唯一索引 `sports_active_slot_unique` 保护有效占用。
- 体育预约同样是直接 `CONFIRMED`，没有待支付阶段。

## 5. 活动抢票并发处理真实时序

```mermaid
sequenceDiagram
    participant FE as 前端 /activities
    participant API as ActivityRegistrationService
    participant Redis as Redis Lua
    participant Queue as activity-registration
    participant Worker as ActivityRegistrationWorker
    participant DB as PostgreSQL

    FE->>API: POST /activities/:id/grab
    API->>DB: 校验用户有效、票种有效、活动处于发布与开售窗口
    API->>DB: assertNotRegistered(activityId, userId)
    API->>Redis: ensureTicketRemaining(ticketId, stock-reserved)
    API->>Redis: reserveTicketForRequest(jobId, ttl=5min)
    alt sold_out / duplicate_pending / missing_stock
        Redis-->>API: 失败原因
        API-->>FE: 快速失败
    else reserved
        Redis-->>API: 预扣成功
        API->>Queue: enqueue(jobId=activity-grab-activity-ticket-user)
        API-->>FE: requestStatus=queued
        FE->>API: 轮询 GET /activities/:id/registration-status
        Queue->>Worker: 投递异步任务
        Worker->>DB: 再查是否已有有效报名
        alt 已存在有效报名
            Worker->>Redis: markRequestCompleted()
            Worker-->>FE: status=confirmed 或现有状态
        else 首次建单
            Worker->>DB: 原子 UPDATE ActivityTicket.reserved = reserved + 1 WHERE reserved < stock
            alt 原子库存更新失败
                Worker->>Redis: compensatePendingReservation()
                Worker-->>FE: status=failed
            else 更新成功
                Worker->>DB: 事务创建 Order(CONFIRMED)
                Worker->>DB: 事务创建 OrderItem
                Worker->>DB: 事务创建 OrderStatusLog
                Worker->>DB: 事务创建 ActivityRegistration(CONFIRMED)
                Worker->>Redis: markRequestCompleted()
                Worker-->>FE: status=confirmed
            end
        end
    end
```

当前实现关键点：

- 热点入口已经真实使用 `Redis Lua + BullMQ + Worker + 数据库最终校验`。
- 当前没有单独的支付确认流程，活动报名建单成功后直接是 `CONFIRMED`。
- 同一用户对同一活动的有效报名由数据库部分唯一索引兜底。

## 6. 异步任务与 Worker 分工

```mermaid
flowchart LR
    subgraph API[api 容器]
        ReservationSvc[ReservationService]
        ActivitySvc[ActivityRegistrationService]
    end

    subgraph Queue[Redis + BullMQ]
        Q1[activity-registration]
        Q2[reservation-attendance]
        Q3[order-expiration]
    end

    PendingCreate[Pending 建单入口\n当前未接通]

    subgraph Worker[worker 容器]
        W1[ActivityRegistrationWorkerService]
        W2[ReservationAttendanceWorkerService]
        W3[OrderExpirationWorkerService]
    end

    ReservationSvc -->|预约成功后调度| Q2
    ActivitySvc -->|抢票预扣成功后入队| Q1
    PendingCreate -. 未写入 expireAt / 未调度 .-> Q3

    Q1 --> W1
    Q2 --> W2
    Q3 --> W3

    W1 -->|确认活动报名或回补缓存| DB[(PostgreSQL)]
    W1 --> Redis[(Redis)]
    W2 -->|缺席判定、封禁更新| DB
    W3 -->|超时取消 pending 订单| DB
```

当前实现关键点：

- `activity-registration` 队列正在被真实使用。
- `reservation-attendance` 队列正在被真实使用，用于签到超时后的缺席判定。
- `order-expiration` 队列已实现，但当前没有任何建单入口会写入 `expireAt` 或调度该队列。

## 7. 当前代码支持的订单状态机

```mermaid
stateDiagram-v2
    [*] --> Confirmed: 学术预约创建成功
    [*] --> Confirmed: 体育预约创建成功
    [*] --> Confirmed: 活动报名 Worker 建单成功

    state "PENDING_CONFIRMATION" as Pending
    state "CONFIRMED" as Confirmed
    state "CANCELLED" as Cancelled
    state "NO_SHOW" as NoShow

    Pending --> Confirmed: POST /orders/:id/confirm\n管理员确认
    Pending --> Cancelled: 内部过期取消 / 用户取消 / 管理员取消
    Confirmed --> Cancelled: POST /orders/:id/cancel
    Confirmed --> NoShow: POST /orders/:id/no-show\n或 reservation-attendance worker

    Cancelled --> [*]
    NoShow --> [*]

    note right of Pending: 当前没有任何 create path 会把订单创建为 Pending，expireAt 也未在建单时写入。
```

当前实现关键点：

- 所有状态迁移都通过 `version` 做 CAS 更新，并写入 `OrderStatusLog`。
- 预约类子表与活动报名子表会在订单迁移时同步更新状态。
- 缺席判定会把订单转为 `NO_SHOW`，并为参与人累计预约违规次数。

## 8. 当前规则引擎执行路径

```mermaid
flowchart LR
    Reservation[ReservationService 创建预约]
    Resource[读取 Resource + RuleBindings]
    User[读取 User.role + creditScore]
    Normalize[normalizeRuleDefinition()]
    Evaluate[assertRuleSatisfied()]
    Pass[继续预约事务]
    Reject[抛出 BadRequest / Forbidden]

    Reservation --> Resource
    Reservation --> User
    Resource --> Normalize
    Normalize --> Evaluate
    User --> Evaluate
    Evaluate -->|通过| Pass
    Evaluate -->|不通过| Reject
```

当前实现关键点：

- 规则引擎当前只在预约创建路径上被调用，不覆盖活动报名或订单取消。
- 当前仅支持三类规则：
  - `min_credit_score`
  - `max_duration_minutes`
  - `allowed_user_roles`

## 9. 当前代码状态摘要

- 已真实落地：学术空间预约、体育设施单场地与组合预约、活动抢票并发处理、订单查询/取消、预约签到、缺席自动判定、资源发布规则与闭馆控制、管理员资源/活动/规则维护。
- 已有基础设施但当前未跑通主路径：`PENDING_CONFIRMATION` 订单创建、订单超时取消、支付回调、`PaymentRecord` 驱动的“幽灵支付”闭环。
- 与题面相比，当前代码额外实现了预约签到窗口、缺席自动判定、按预约类别封禁违规用户等机制。
