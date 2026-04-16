# 技术方案 V2

## 文档说明

本文件基于 `technical-solution-v1.md` 的评审结果修订。
V2 作为当前默认推荐实现，优先级高于 V1。
如与参考资料冲突，以 `docs/reference/` 和比赛 PDF 为准。

## 1. 方案目标

在单台 `2 vCPU / 2 GiB RAM` 服务器约束下，交付一个可公网演示、可容器化部署、可逐步扩展的校园预约与活动平台，覆盖：

- 学术空间预约
- 体育设施预约
- 校园活动报名与高并发抢票
- 统一订单状态机
- 可配置规则引擎

## 2. 权威输入与边界

### 2.1 权威输入

- 需求以 `docs/reference/第一届百块奖金web大赛-技术赛道.pdf` 为最高准则
- 需求重建稿参考 `docs/reference/01_需求说明.md`
- 系统规则参考 `docs/reference/02_规则说明.md`
- 部署域名与入口边界参考 `docs/standards/deployment-baseline.md`

### 2.2 当前边界

- 首版允许使用 Mock 数据与 Mock 支付
- 不接入真实校园身份系统
- 不引入 Kafka、Elasticsearch 等额外重型基础设施
- 先保证单机可稳定跑通，再考虑水平拆分

## 3. 总体设计原则

- 单机优先，容器化优先
- 数据一致性优先于过度追求吞吐
- 高并发优化只作用于活动抢票等热点路径
- 核心约束必须有数据库层保护，不能只靠业务层 `if` 判断
- 任何状态流转都必须可审计、可回放、可补偿

## 4. 推荐技术栈

### 4.1 前端

- `React + TypeScript + Vite`
- `React Router`
- `TanStack Query`
- `Zustand`
- `Tailwind CSS`

### 4.2 后端

- `NestJS + TypeScript`
- `Prisma`
- `class-validator`
- `BullMQ`

### 4.3 数据与基础设施

- `PostgreSQL`
- `Redis`
- `Nginx`
- `Docker Compose`
- `GitHub Actions`
- 镜像仓库：优先 `GHCR`

## 5. 单机部署拓扑

- 前端域名：`campusbook.top`、`www.campusbook.top`
- 后端域名：`api.campusbook.top`
- Nginx 必须通过 `server_name` 分流
- 前端由 Nginx 直接托管静态文件
- 后端反代到容器内 API 服务
- PostgreSQL、Redis、API、Worker 同机部署

当前阶段可以先按 HTTP 落地联调。
正式演示环境必须补齐 HTTPS 与 `80 -> 443` 跳转。
升级 HTTPS 时不得改变域名分工和 Nginx 路由边界。

## 6. 应用模块划分

- `auth`：注册、登录、刷新令牌、角色与权限
- `user`：用户资料、信用分、画像
- `resource`：资源主实体、资源单元、组合资源
- `reservation`：预约入口、冲突校验、占用写入
- `activity`：活动管理、票种管理、放票状态
- `order`：统一订单与状态机
- `payment`：Mock 支付与模拟回调
- `rule-engine`：规则绑定、执行器、处罚逻辑
- `notification`：站内通知与异步事件
- `jobs`：超时取消、库存回补、补偿任务
- `admin`：后台管理与运营视图

## 7. 关键一致性设计

### 7.1 学术空间预约

比赛要求学术空间为原子资源，并在预约前后自动加入 5 分钟缓冲参与冲突判断。

V2 要求：

- 用户提交的是展示时间段
- 后端计算实际占用区间：`occupied_start = start_time - 5min`
- 后端计算实际占用区间：`occupied_end = end_time + 5min`
- PostgreSQL 以 `tstzrange` 持久化实际占用区间
- 使用排斥约束防止同一资源单元出现重叠占用

推荐约束：

```sql
EXCLUDE USING gist (
  resource_unit_id WITH =,
  occupied_range WITH &&
)
```

这意味着并发下即使两个请求都通过了业务层预检，数据库仍会拒绝非法重叠写入。

### 7.2 体育设施预约

比赛要求体育设施按 1 小时离散槽位开放，并支持组合预约。

V2 要求：

- 体育设施统一抽象为 `resource_unit`
- 每个预约槽位单独持久化为占用记录
- `(resource_unit_id, slot_start)` 建唯一约束
- 组合预约在同一事务内写入所有槽位占用
- 任一槽位写入失败，则整单回滚

这样可以把“组合预约只要任一资源冲突则整单失败”变成数据库可执行约束，而不是只留在业务描述里。

### 7.3 活动抢票

比赛要求热门活动不能直接把所有瞬时流量打进数据库，并且必须绝不超发。

V2 推荐链路：

1. API 校验活动开放时间与基础资格
2. Redis Lua 脚本做库存预扣与热点判重
3. 成功后投递 BullMQ 任务
4. Worker 按幂等 `jobId` 建单
5. 数据库通过唯一约束防止重复报名
6. 只有数据库事务明确失败时才回补 Redis

必须补的约束：

- `jobId = activity:{activityId}:user:{userId}`
- 活动订单增加唯一约束，防止同一用户重复拿票
- Worker 可重试，但消费逻辑必须幂等
- 失败任务进入死信或错误队列，便于人工回查

### 7.4 订单状态机

订单主状态保持不变：

- `待支付/确认`
- `已确认`
- `已取消`
- `已爽约`

V2 要求：

- 订单表保留 `version` 字段
- 支付成功、超时取消、用户取消都基于旧状态 CAS 更新
- 所有状态变更写入 `order_status_log`
- 超时取消任务只处理仍处于 `待支付/确认` 的订单
- 幽灵支付场景必须通过集成测试覆盖

### 7.5 规则引擎

V1 的规则引擎边界过宽。
V2 先收敛为“规则配置表 + 执行器 + 可插拔检查器”。

首版支持：

- 用户身份差异
- 信用分额度调整
- 爽约惩罚
- 预约时长限制
- 可预约次数限制

暂不做通用脚本执行器，避免在比赛周期内引入安全与调试复杂度。

## 8. 鉴权与安全边界

### 8.1 登录态设计

- Access Token：短期有效，仅存前端内存
- Refresh Token：存放在 `HttpOnly` Cookie
- Cookie 作用域：`api.campusbook.top`
- 前端调用 API 时使用 `credentials: include`

### 8.2 CORS 与 CSRF

- CORS 只允许：
  - `https://campusbook.top`
  - `https://www.campusbook.top`
- 刷新令牌、登出等 Cookie 驱动接口使用 `POST`
- 对 Cookie 驱动接口补双提交或等价 CSRF 防护

### 8.3 其他安全要求

- 输入统一校验
- ORM 与参数化查询防 SQL 注入
- 富文本和可展示字段统一做 XSS 清洗
- 对象级权限校验，防止越权访问
- 审计日志覆盖关键状态变化与后台操作

## 9. 仓库结构建议

```text
.
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── shared-types/
│   ├── eslint-config/
│   └── tsconfig/
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── scripts/
├── docs/
└── .github/workflows/
```

包管理建议：

- 优先 `pnpm workspace`
- 若当前环境暂未安装 `pnpm`，可先用 `corepack` 激活后再初始化仓库

## 10. CI/CD 与发布路径

### 10.1 单一路径

V2 明确采用一条发布路径，避免 V1 中“本地构建”和“镜像发布”并存。

推荐流程：

1. 开发分支提交 PR
2. GitHub Actions 执行 `lint + test + build`
3. 合并到 `main`
4. 构建前端与后端镜像
5. 以 commit SHA 打 tag 并推送 `GHCR`
6. 手动触发生产部署工作流
7. 服务器拉取指定 tag 并执行 `docker compose up -d`
8. 部署后执行健康检查与回滚判定

### 10.2 服务器约束

- 服务器不承担长期手工构建职责
- 服务器只负责拉镜像、挂载配置、启动容器
- 回滚基于上一个稳定镜像 tag

## 11. 测试与验收闭环

比赛中的性能、无障碍、安全与工程要求不能只写在文档里，必须落实为验证动作。

V2 最低验收要求：

- 单元测试：订单状态机、规则引擎、资格校验
- 集成测试：预约冲突、活动抢票幂等、幽灵支付保护
- E2E：注册登录、学术空间预约、体育预约、活动抢票
- 并发压测：对抢票接口执行基准压测
- 无障碍检查：表单、键盘导航、图片 alt、色彩对比
- 性能检查：Lighthouse 关注 LCP、INP、CLS

推荐工具：

- `Vitest`
- `Playwright`
- `k6` 或 `Artillery`
- `axe-core`
- `Lighthouse CI`

## 12. 阶段计划建议

### Milestone 1: 仓库与运行骨架

- monorepo 初始化
- 前后端最小可运行
- Docker Compose 跑通 PostgreSQL、Redis、API
- Nginx 基于域名分流的 HTTP 联调跑通

### Milestone 2: 预约主流程

- 注册登录
- 学术空间预约与排斥约束
- 体育设施槽位占用与组合预约
- 统一订单表与状态日志

### Milestone 3: 活动抢票

- 活动管理
- Redis 预扣库存
- BullMQ 异步建单
- 幂等消费与库存回补

### Milestone 4: 规则与交付

- 规则引擎初版
- 管理后台核心页面
- CI/CD 跑通
- HTTPS 与正式演示环境上线

## 13. 当前主要风险

- `2 GiB RAM` 对 PostgreSQL、Redis、API、Worker、Nginx 同机运行较紧张，必须控制容器数量与镜像体积
- 当前未启用 HTTPS，正式演示前必须补齐证书与 443 配置
- 当前仓库还没有应用骨架，方案已明确但实现尚未开始
- 服务器上未发现 `pnpm`、`nginx`、`psql`、`redis-server` 主机级工具，若选择容器优先问题不大，但调试便利性不足

## 14. 结论

V2 保留了 V1 的技术栈方向，但把以下内容收紧为可执行方案：

- 预约冲突由数据库约束兜底
- 抢票链路补齐幂等与唯一约束
- 登录态与跨子域鉴权边界明确
- CI/CD 采用单一路径
- HTTP 与 HTTPS 的阶段边界明确
- 性能、无障碍、安全都有对应验证动作
