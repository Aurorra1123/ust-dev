# 2026-04-22 赛题核心偏题审查

## 审查任务说明

说明：

- 本节是根据本轮用户要求整理出的实际审查口径。
- 不包含系统 / 开发者隐藏 prompt 原文。
- 本轮只审查“是否偏题”，不做代码审美评价。

审查目标：

- 严格对照比赛题目《智约校园：多态空间调度与高并发活动综合平台》
- 判断当前项目是否真的覆盖题目最核心的考点，而不是只做了一个一般性的预约网站

重点核查项：

1. 是否真的做了“多态空间建模”，而不是用扁平化资源表凑合
2. 学术空间的连续时间 + 隐形 5 分钟缓冲，是否落在数据库 / 系统底层约束，而不是只在前端提示
3. 体育设施是否真的按离散 slot 处理，并支持组合化资源
4. 热门活动是否真的针对高并发做了架构，而不是普通 CRUD 报名
5. 订单状态机是否真的处理了幽灵支付，而不是只定义了几个状态枚举
6. 规则引擎是否真的可配置、可扩展，而不是把规则藏在 service 的 if-else
7. 前端是否真的落实了响应式、a11y、性能和安全，而不是口头声明
8. DevOps 是否真的能让评委一键拉起，而不是写了很多手工步骤

要求输出：

- 哪些地方真正命中了赛题核心
- 哪些地方只是“看起来相关”，但还不足以得分
- 哪些地方明显偏题或做浅了
- 如果站在评委视角，这个作品更像“普通课程作业”还是“认真打比赛的项目”，并解释原因

## 本次核查范围

- Prisma schema 与 migrations
- reservation / orders / activities / rules 模块
- worker / BullMQ / Redis Lua
- 前端核心预约与活动页面
- Docker Compose、judge 一键启动脚本、README、smoke 脚本
- 既有 verification 与 architecture 审计文档

补充核查：

- 运行了 `pnpm test`
- 结果是命令可通过，但仓库当前没有真实业务测试用例输出，基本只做了 workspace 级扫描

## 审查结果

### 一、真正命中赛题核心

#### 1. 多态空间建模是真做了，不是扁平资源表

- 项目不是只有一个资源总表。
- 真实模型包含：
  - `Resource` 作为统一资源基座
  - `ResourceUnit` 作为最小可调度单元
  - `ResourceGroup / ResourceGroupItem` 作为体育组合资源
  - `AcademicReservation` 与 `SportsReservationSlot` 作为两种不同预约落库实体
- 这是“统一资源底座 + 差异化调度模型”，不是普通课程作业里常见的单表字段堆砌。

关键落点：

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/resource/resource-write.service.ts`

#### 2. 学术空间连续时间 + 隐形 5 分钟缓冲落在后端和数据库底层

- 后端在创建学术预约时先按前后各 `5` 分钟做预检查。
- 数据库 migration 又加了 `PostgreSQL EXCLUDE USING GIST` 排斥约束。
- 约束直接按 `startTime/endTime ± buffer` 计算重叠，不依赖前端提示。

这点是强命中，因为题目强调的是“隐形缓冲也参与冲突判断”，而你这里确实下沉到了数据库层。

关键落点：

- `apps/api/src/modules/reservation/reservation.service.ts`
- `apps/api/prisma/migrations/20260417020123_academic_reservation_flow/migration.sql`

#### 3. 体育设施按离散 slot 建模，并真实支持组合预约

- 体育预约请求强制整点对齐，按 `1` 小时 slot 处理。
- 组合预约不是前端拼一下展示，而是后端支持 `resourceGroupId` 作为正式目标。
- 只要组合里的任一成员单元在目标 slot 上冲突，整单直接失败。
- 数据库还有仅对有效占用生效的唯一索引兜底。

这点也是真命中，不是“看起来有组合文案”，而是数据模型、接口和约束都在。

关键落点：

- `apps/api/src/modules/reservation/reservation.service.ts`
- `apps/api/prisma/migrations/20260417023023_sports_slot_booking/migration.sql`

#### 4. 热门活动高并发链路是真实架构，不是普通 CRUD 报名

- 活动抢票入口不是直接写数据库。
- 当前链路是：
  - Redis Lua 预扣库存
  - BullMQ 队列异步削峰
  - 独立 worker 建单
  - 数据库侧再用 `reserved < stock` 条件更新做最终库存兜底
  - 活动用户唯一约束防止重复报名
- 这已经明显超出普通课程作业的“报名表 + 插一条记录”。

关键落点：

- `apps/api/src/modules/activities/activity-registration.service.ts`
- `apps/api/src/modules/activities/activity-inventory-cache.service.ts`
- `apps/api/src/modules/activities/activity-registration-worker.service.ts`
- `apps/api/prisma/migrations/20260418101500_activity_registration_flow/migration.sql`

#### 5. DevOps 具备评委一键拉起能力

- 存在 judge 专用路径，不依赖真实域名和 HTTPS。
- `scripts/judge-up.sh` 会顺序完成：
  - build
  - 启库
  - migrate
  - seed
  - 启动 `api / worker / web / nginx`
  - 运行 smoke
- README 和 `docs/standards/judge-quick-start.md` 也把这条最短验收路径写清楚了。

这点对比赛交付很重要，而且你确实做到了“评委拿到仓库后最少脑补”。

关键落点：

- `scripts/judge-up.sh`
- `infra/docker-compose.yml`
- `infra/docker-compose.judge.yml`
- `infra/nginx/judge-conf.d/default.conf`
- `scripts/smoke-judge.mjs`
- `README.md`

### 二、只是看起来相关，但还不足以高分

#### 1. 规则引擎是“最小可配置版”，但还不够强

- 优点：
  - 规则不直接散落在预约 service 的 if-else 中
  - 有 `Rule` 表、`ResourceRuleBinding`、独立执行器
  - 管理端可以增删改规则并绑定资源
- 不足：
  - 当前规则类型只有 `min_credit_score / max_duration_minutes / allowed_user_roles`
  - DTO 和执行器都把类型写死了
  - 扩一个新规则仍然要改代码，不算很强的可扩展
  - `UserRuleProfile` 和 `UserCreditLog` 已建模，但主链路里没有真正用起来

所以它不是纯 if-else 假装规则引擎，但也还没有达到“规则平台化”的强度。

关键落点：

- `apps/api/src/modules/rules/rule-engine.ts`
- `apps/api/src/modules/rules/rules.service.ts`
- `apps/api/src/modules/rules/dto/create-rule.dto.ts`
- `apps/api/prisma/schema.prisma`

#### 2. 前端非功能项只完成了基础层，不足以把这一题打满

- 已落地的部分：
  - 响应式布局真实存在
  - 表单普遍使用了 `label`
  - 部分按钮和交互有 `aria-*`
  - 图片有 `alt`
  - 后端有输入校验、鉴权、订单读权限控制、HttpOnly refresh cookie
- 不足的部分：
  - 时间轴这类核心密集视图仍主要依赖颜色表达
  - 看不到更系统的键盘导航与语义化无障碍设计证据
  - 仓库里没有 Lighthouse / Web Vitals / WCAG 达标证据
  - API 侧没有看到 `helmet`、CSP 等更完整安全硬化

因此它不能算“口头声明”，但也还不能说已经把题面里的前端非功能要求做扎实了。

关键落点：

- `apps/web/src/ui/pages/spaces-page.tsx`
- `apps/web/src/ui/pages/sports-page.tsx`
- `apps/web/src/ui/pages/spaces/spaces-availability-panel.tsx`
- `apps/web/src/ui/pages/sports/sports-schedule-panel.tsx`
- `apps/api/src/main.ts`
- `apps/api/src/modules/auth/auth.service.ts`

### 三、明显偏题或做浅了

#### 1. 幽灵支付并没有真正做完，这是当前最大缺口

- 你有这些东西：
  - `Order.status`
  - `version` CAS
  - `OrderStatusLog`
  - `PaymentRecord` 表
  - 延迟取消队列与 worker
- 但真正缺的，是题目要看的“支付成功 vs 超时取消并发对撞闭环”：
  - 当前没有 `payment` 模块
  - 没有支付回调控制器
  - 没有真实写入 `PaymentRecord` 的主链路
  - 学术预约、体育预约、活动成功建单都直接写成 `CONFIRMED`
  - 主创建入口没有稳定产出 `PENDING_CONFIRMATION + expireAt`

结果就是：

- 状态机骨架在
- 延迟取消基础设施在
- 但“幽灵支付”这个赛题高分点并没有真实发生，也没有真正被系统解决

这不是小瑕疵，而是会直接影响评委对第 5 点的判断。

关键落点：

- `apps/api/src/modules/reservation/reservation.service.ts`
- `apps/api/src/modules/activities/activity-registration.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `docs/architecture/current-implementation-audit-2026-04-21.md`

### 四、评委视角判断

#### 更像什么

如果我是评委，我会认为这个作品更像：

- **认真打比赛的项目**

而不是：

- **普通课程作业**

#### 原因

因为它在以下比赛味很重的点上是真做了：

- 资源多态建模
- 学术空间缓冲冲突的数据库级约束
- 体育离散 slot 与组合资源
- Redis Lua + BullMQ + worker 的抢票架构
- judge 一键拉起和 smoke 验收路径

这些都不是普通 CRUD 作业会主动做到的层级。

但如果进一步判断完成度，我会把它归类成：

- **认真打比赛，但还处在中后期、尚未完全收口的版本**

核心原因有三个：

1. `幽灵支付` 这个高分点还没有真正闭环  
2. `规则引擎` 只有最小闭环，还不够宽、不够深  
3. `前端非功能要求` 有基础落实，但缺少更严格、可量化、可验收的证据

## 总结判断

一句话总结：

- 这个项目已经明显不是“普通预约网站”
- 但也还不是“所有赛题核心点都打透了的完成版比赛项目”

按赛题核心命中情况，我的综合判断是：

- 真命中：`1 / 2 / 3 / 4 / 8`
- 半命中：`6 / 7`
- 明显缺口：`5`
