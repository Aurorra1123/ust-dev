# Current Implementation Audit 2026-04-21

本文件用于确认“当前代码真正实现到了哪里”，避免继续把推荐方案、比赛题面和现有代码混为一谈。

审计结论基于以下真实实现入口：

- `apps/api/src/app.module.ts`
- `apps/api/src/worker.module.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/`
- `apps/api/src/modules/reservation/`
- `apps/api/src/modules/activities/`
- `apps/api/src/modules/orders/`
- `apps/api/src/modules/rules/`
- `apps/api/src/modules/resource/`
- `apps/api/src/modules/auth/`
- `apps/web/src/routes.tsx`
- `apps/web/src/ui/pages/`
- `infra/docker-compose.yml`
- `infra/nginx/conf.d/campusbook.conf`

## 一句话结论

当前代码已经真实落地了“校园预约 + 活动抢票 + 统一订单 + 独立 Worker + Redis/BullMQ + 管理后台”的主框架，但它还不是完整的比赛终态。

尤其要注意：

- 预约和活动报名当前都是直接 `CONFIRMED`，并没有真实支付闭环。
- `PENDING_CONFIRMATION`、`expireAt`、超时取消 Worker、管理员确认接口都存在，但当前主创建链路不会进入这些分支。
- 活动并发链路是真实落地的。
- 规则引擎是真实落地的，但范围还比较窄。

## 当前真实已实现

### 1. 运行时架构

- 当前运行时是单机 `web + api + worker + postgres + redis + nginx`。
- `api` 与 `worker` 已经拆成两个容器，异步任务不依赖 API 进程内执行。
- 前端与管理后台共用一个 SPA，管理员走 `/admin`。
- Nginx 通过 `server_name` 分流：
  - `campusbook.top`
  - `www.campusbook.top`
  - `api.campusbook.top`

### 2. 认证与会话

- 当前只有登录、刷新、退出，没有注册流程。
- Access Token 通过前端内存态保存并作为 `Authorization: Bearer` 发送。
- Refresh Token 放在 `HttpOnly Cookie`，路径限定为 `/auth`。
- 前端启动时会先尝试 `POST /auth/refresh` 恢复会话。
- 当前登录本质上是“演示账号 + 已存在学生账号”的混合模式，不是正式校园身份系统接入。

### 3. 学术空间预约

- 前端页面：`/spaces`
- 接口入口：`POST /reservations/academic`
- 已实现能力：
  - 连续时间段预约
  - 同行人邮箱解析与参与人写入
  - 发布规则与闭馆规则拦截
  - 资源绑定规则校验
  - 学术空间前后各 `5` 分钟缓冲冲突判断
  - 事务内创建订单、订单明细、预约记录、参与人记录
  - 预约成功后写入签到缺席判定任务
- 数据库兜底：
  - migration 中已存在 `academic_reservation_no_overlap` 排斥约束

### 4. 体育设施预约

- 前端页面：`/sports`
- 接口入口：`POST /reservations/sports`
- 已实现能力：
  - 单场地预约
  - 组合场地预约
  - `1` 小时整点槽位归一化
  - 前端时段表读取匿名占用状态
  - 发布规则与闭馆规则拦截
  - 资源绑定规则校验
  - 事务内批量创建 `OrderItem` 与 `SportsReservationSlot`
  - 预约成功后写入签到缺席判定任务
- 数据库兜底：
  - migration 中已存在 `sports_active_slot_unique` 部分唯一索引

### 5. 活动抢票并发处理

- 前端页面：`/activities`
- 接口入口：
  - `POST /activities/:id/grab`
  - `GET /activities/:id/registration-status`
- 已实现能力：
  - 校验活动状态和售卖窗口
  - 先检查是否已存在有效报名
  - Redis 中维护票种剩余库存 key
  - Lua 脚本完成“判重 + 预扣库存 + pending key 写入”
  - BullMQ 异步建单，`worker` 独立消费
  - `jobId` 按 `activity-grab-activity-ticket-user` 幂等化
  - Worker 中使用 SQL 原子更新 `reserved < stock` 做数据库最终库存兜底
  - 建单失败时回补 Redis 预扣并记录失败原因
  - 前端排队中时每 `2s` 轮询一次报名状态
- 数据库兜底：
  - `ActivityTicket_reserved_range_check`
  - `activity_registration_active_user_unique`

### 6. 统一订单与异步任务

- 当前订单聚合根已经真实存在：
  - `Order`
  - `OrderItem`
  - `OrderStatusLog`
  - `AcademicReservation`
  - `SportsReservationSlot`
  - `ActivityRegistration`
- 当前真实可用的异步任务有两类：
  - `activity-registration`
  - `reservation-attendance`
- 当前真实状态迁移机制：
  - `OrdersService.transitionOrder()` 基于 `version` + `status` 做 CAS
  - 状态迁移会同步更新关联子表
  - 所有迁移都会写 `OrderStatusLog`

### 7. 签到、缺席与预约限制

- 当前代码已经实现了原题之外更细的预约后置流程：
  - 预约开始前 `10` 分钟到开始后 `10` 分钟可签到
  - 任一参与人都可以对自己的参与记录签到
  - 到签到关闭时仍无人签到，则 Worker 自动将订单改为 `NO_SHOW`
  - 缺席后会累计 `UserReservationRestriction.violationCount`
  - 第三次及以后违规会为对应预约类别设置 `7` 天封禁

### 8. 规则引擎

- 当前规则执行入口只在预约创建流程。
- 真实支持的规则类型只有三种：
  - `min_credit_score`
  - `max_duration_minutes`
  - `allowed_user_roles`
- 规则结构已经具备：
  - `Rule`
  - `ResourceRuleBinding`
  - `UserRuleProfile`
- 当前实现方式更接近“规则表 + 解析器 + 执行器”，还不是通用表达式引擎或完整责任链体系。

### 9. 前端真实状态

- 学生端当前真实主路径：
  - 登录
  - 首页
  - 学术预约
  - 体育预约
  - 活动报名
  - 我的订单
  - 订单详情
  - 取消记录
- 管理端当前真实主路径：
  - 总览
  - 资源工作区
  - 活动工作区
  - 规则工作区
- 当前前端与后端已经真实接通，不是纯静态原型。

## 当前半落地或未落地

### 1. 真实支付闭环未落地

- schema 中有 `PaymentRecord`，但当前 `AppModule` 没有 `payment` 模块。
- 当前代码里没有支付控制器、支付回调处理器、支付成功写 `PaymentRecord` 的真实链路。
- 结果是：
  - “待支付/确认 -> 已确认”的支付成功分支目前没有实际入口
  - PDF 中强调的“幽灵支付”目前只有状态机和过期任务基础设施，没有完整支付对撞闭环

### 2. `PENDING_CONFIRMATION` 当前处于休眠态

- schema、控制器和 `OrdersService` 都支持 `PENDING_CONFIRMATION`
- 但当前三个主创建入口：
  - 学术预约
  - 体育预约
  - 活动抢票成功建单
  都直接创建为 `CONFIRMED`
- 结果是：
  - 管理员确认接口存在，但当前主链路基本不会用到
  - `expireAt` 当前不会在建单时写入
  - `order-expiration` 队列与 Worker 已实现，但当前没有 live producer

### 3. 规则引擎范围还不够宽

- 当前规则只覆盖预约创建。
- 规则没有接管：
  - 活动报名资格
  - 订单取消惩罚
  - 缺席扣分
  - 信用分动态变化
- `UserCreditLog` 已建模，但当前代码中没有真实写入路径。

### 4. 前端与题面仍有差距

- 学术空间页当前没有展示公开占用日程，只是直接选资源和时间提交。
- 登录页没有注册流程。
- 订单详情页里的“确认预约”按钮实际对应的是签到，不是订单确认。

## 对比赛题面的影响

### 当前比较强的部分

- 多态资源建模已经真实落在表结构与代码中。
- 学术缓冲冲突和体育槽位唯一都有数据库层保护。
- 活动高并发抢票链路是真实的，不只是文档设计。
- Worker、Redis、BullMQ、Docker Compose、Nginx 域名分流都已落地。

### 当前最需要补的部分

- 真实支付与 `PENDING_CONFIRMATION` 主链路
- 完整的“幽灵支付”闭环验证
- 更完整的规则引擎与处罚体系
- 题面要求下更严格的前端无障碍、性能与验收证据

## 建议的下一步

1. 如果目标是“当前代码真实状态答辩”，优先以 `docs/architecture/architecture-diagrams.md` 里的 code-verified 图表为主，不要再引用旧的推荐方案图。
2. 如果目标是“补齐比赛终态”，下一阶段优先补：
   - 真实支付/确认链路
   - `expireAt` 写入与 pending 订单创建
   - 支付成功与超时取消并发对撞测试
3. 如果目标是“减少前后文漂移”，后续所有文档讨论都应明确区分：
   - 题面要求
   - 推荐方案
   - 当前代码真实实现
