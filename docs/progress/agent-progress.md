# Agent Progress Log

本文件用于跨会话交接，任何一次较完整的工作结束前都应更新。

## 2026-04-19

### 已完成

- 完成 `PUX-006`：重做登录后首页与身份分流
- 首页当前已按三种状态分流：
  - 未登录：简洁统一登录入口
  - 学生：真实服务首页
  - 教师或管理身份：默认进入工作台首页
- `apps/web/src/ui/pages/home-page.tsx` 已重写为角色化首页，不再保留旧的说明型首页结构
- 学生首页当前已聚焦：
  - 体育空间
  - 校园活动
  - 学术空间
  - 历史记录
  - 近期活动通知栏
- `apps/web/src/ui/pages/login-page.tsx` 已按身份默认跳转：
  - 学生 -> `/`
  - 教师或管理 -> `/admin`
- `apps/web/src/ui/app-shell.tsx` 已按身份收口导航：
  - 学生端显示三类服务与历史记录
  - 教师端只保留工作台入口
- 教师工作台首页文案已收口为维护与更新视角，不再混入学生端语义
- 本轮继续以低负载方式将新的 `apps/web/dist` 同步到 `infra-web-1`
- 线上 `https://campusbook.top` 当前开始返回新的前端资源：
  - `index-BEYhZzb1.js`
  - `index-CJKyMaj0.css`
- 新增验证证据：
  - `docs/verification/2026-04-19/pux-006-role-based-homepages.md`
- 根据最新产品判断，新增 `PUX-006`：
  - 重做登录后首页与身份分流
  - 学生首页收敛为体育空间、校园活动、学术空间三大入口
  - 学生首页补历史记录与近期活动通知栏
  - 教师或管理身份默认进入工作台首页，聚焦数据更新、快捷管理与通知发布
- 当前首页的主要问题已经明确：
  - 仍带较多说明性内容
  - 不像真实登录后门户首页
  - 学生与教师登录后的默认落点还不够贴近真实使用场景
- 完成 `PUX-004`：补齐核心页面的状态设计、移动端收口和最终产品文案
- 当前前端已新增统一状态面板 `StatePanel`，用于加载态、错误态和一般提示态
- 用户端与管理端页面的纯文本“加载中/报错中”提示已改为结构化状态块
- `apps/web/src/ui/app-shell.tsx` 已完成一轮文案与移动端收口：
  - 顶部品牌标签改为中文产品语境
  - 访客态提示更贴近产品口吻
  - 顶部导航已收口为可横向滚动的移动端入口
- `apps/web/src/ui/pages/login-page.tsx` 已移除偏技术化的登录说明，改为面向用户的统一入口文案
- `apps/web/src/ui/pages/home-page.tsx` 已进一步收掉“演示环境/技术说明区”等口吻
- 本轮继续以低负载方式将新的 `apps/web/dist` 同步到 `infra-web-1`
- 线上 `https://campusbook.top` 当前开始返回新的前端资源：
  - `index-B2v9MQh6.js`
  - `index-DlTMmolE.css`
- 当前可认为：
  - `PUX-002` 已完成
  - `PUX-003` 已完成
  - `PUX-004` 已完成
- 新增验证证据：
  - `docs/verification/2026-04-19/pux-004-responsive-states-and-copy.md`
- 完成 `PUX-003`：将管理端从长表单式操作页重构为可切换工作区的后台工作台
- `apps/web/src/ui/pages/admin-page.tsx` 已新增：
  - 工作区导航
  - 运营总览
  - 资源工作区
  - 活动工作区
  - 规则工作区
- 管理端当前已支持在同一页面内按任务切换视图，而不是在单页长列表里来回查找表单
- 资源工作区已补：
  - 当前资源结构摘要
  - 资源列表更强的选中态
  - 新增资源与新增资源单元的分层工作区
- 活动工作区已补：
  - 当前活动详情头部
  - 票种概览
  - 新增活动与活动加票/状态切换的分层工作区
- 规则工作区已补：
  - 规则卡片视图
  - 规则概况摘要
  - 快照说明区
- 本轮管理端产品化已通过本地校验：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web lint`
  - `pnpm --filter web build`
- 已以低负载方式将新的 `apps/web/dist` 同步到 `infra-web-1`
- 线上 `https://campusbook.top` 当前开始返回新的前端资源：
  - `index-YDyVfSEP.js`
  - `index-CKlQi4FL.css`
- 新增验证证据：
  - `docs/verification/2026-04-19/pux-003-admin-workspace.md`
- 以低负载方式将本地已构建的 `apps/web/dist` 同步到运行中的 `infra-web-1`
- 线上 `https://campusbook.top` 已开始返回新的前端资源：
  - `index-D0P-THWd.js`
  - `index-ZefzWJZj.css`
- 验证通过线上首页已切换到新产物，新的首页与用户端产品化页面已经可在域名站点看到
- 新增验证证据：
  - `docs/verification/2026-04-19/pux-002-live-web-hot-refresh.md`
- 推进 `PUX-002` 第二轮用户端产品化改造，重点增强“肉眼可见”的门户感和业务工作区层级
- 升级通用展示组件：
  - `apps/web/src/ui/page-hero.tsx`
  - `apps/web/src/ui/page-section.tsx`
  - `apps/web/src/ui/user-experience-kit.tsx`
- 新增产品化展示能力：
  - `HighlightPanel`
  - `StepList`
- 重做用户端首页：
  - 引入“今日服务总览”
  - 首页增加统一服务高亮面板、三步使用引导和关键规模区块
  - 首页已接入学术资源、体育资源和活动数量的真实查询
- 继续重构用户主路径页面：
  - `spaces-page.tsx`
  - `sports-page.tsx`
  - `activities-page.tsx`
  - `orders-page.tsx`
- 学术空间页已补：
  - 当前选择摘要
  - 更明显的资源卡片头部
  - 预约预览卡
  - 更清晰的三步使用说明
- 体育设施页已补：
  - 槽位服务高亮区
  - 单场地/组合场地三步说明
  - 当前配置摘要
  - 更明显的资源详情头部
- 活动页已补：
  - 活动服务高亮区
  - 报名三步说明
  - 更明显的活动详情头部
- 订单页已补：
  - 统一订单中心高亮区
  - 状态回看三步说明
  - 更强的列表选中态
- 新增验证证据：
  - `docs/verification/2026-04-19/pux-002-user-pages-second-pass.md`

### 当前状态

- `PUX-006` 已完成
- `PUX-003` 已完成
- `PUX-002` 已完成
- `PUX-004` 已完成
- 当前首页已经不再是“平台理念说明页”，而是按未登录、学生、教师三种状态分流
- 当前用户端的首页、学术空间、体育设施、活动和订单页都已具备更明显的产品门户结构，并补齐了状态层和最终文案收口
- 当前管理端已经具备“总览 + 工作区切换 + 资源/活动/规则分区”的后台结构
- 当前域名站点已经通过低负载热刷新切到最新前端产物
- 本次线上刷新采用的是容器内同步静态产物，不是正式镜像重建；后续若重新创建 `web` 容器，仍需做一次正式镜像级部署收口

### 下一步建议

1. 开始执行 `PUX-005`，补真实浏览器回归和最终截图证据
2. 后续做一次正式镜像级前端部署收口，替代当前热刷新方式
3. 若继续打磨，可再做一轮教师工作台的高频操作细节优化

### 注意事项

- 当前服务器仍是 `2C2G` 且无 swap，前端校验与部署继续保持顺序执行
- 产品化改造阶段优先动前端源码，不要频繁重建 Docker 镜像
- 当前线上可见变化已经通过热刷新生效，但这不是最终部署基线

## 2026-04-18

### 已完成

- 完成 `PUX-002` 的第一轮用户端页面重构，但尚未正式收口
- 新增通用用户端产品化组件 `apps/web/src/ui/user-experience-kit.tsx`
- 学术空间、体育设施、活动、我的订单四页已完成首轮产品化调整：
  - 增加指标卡和说明区
  - 重构列表/详情/表单层次
  - 补空态与提示块
  - 统一错误态语义颜色
- 新增验证证据 `docs/verification/2026-04-18/pux-002-user-pages-first-pass.md`
- 完成 `PUX-001`：建立产品化第一阶段的设计系统与应用壳层
- 新增 `docs/architecture/productization-plan-v1.md`
- 产品化方向已明确为香港科技大学（广州）校方服务门户，而不是纯演示站点
- 当前前端视觉基线已切换到 `HKUST(GZ)` 的深蓝 + 金色主轴：
  - `#002F6B`
  - `#1D4F92`
  - `#A88337`
  - `#C8B388`
- `apps/web/tailwind.config.ts` 与 `apps/web/src/styles.css` 已完成首轮品牌色、阴影、背景与字体基线调整
- `AppShell` 已重构为正式门户壳层，新增：
  - 顶部校方服务条
  - 品牌首屏
  - 当前模块说明
  - 统一导航胶囊
- `PageHero` / `PageSection` 已升级为统一设计系统区块
- 首页已从工程阶段说明页改为校园服务门户首页
- 登录页已改为统一身份入口页
- 管理首页已补“运营概览”卡片区，不再只剩操作面板
- 用户端错误态已统一切换为 `danger` 语义色，避免与品牌金混用
- 新增验证证据 `docs/verification/2026-04-18/pux-001-design-system-baseline.md`
- 完成 `DOCS-001`：将 `docs/reference/` 继续映射为正式产品、规则与领域模型入口
- 新增正式文档入口：
  - `docs/architecture/product-baseline.md`
  - `docs/architecture/domain-model-baseline.md`
  - `docs/standards/business-rules-baseline.md`
  - `docs/standards/reference-mapping.md`
- `docs/reference/README_说明.md` 已补充输入材料层维护约定
- `docs/README.md` 与 `docs/architecture/README.md` 已加入新的正式阅读入口
- 补充证书续期自动化基线：
  - 新增 `scripts/renew-https-certs.sh`
  - 根命令新增 `pnpm tls:renew` 与 `pnpm tls:renew:dry-run`
  - `docs/standards/https-deployment-playbook.md` 已补充续期说明
- 新增验证证据 `docs/verification/2026-04-18/docs-001-reference-mapping-and-cert-renewal.md`
- 完成正式 HTTPS 切换：
  - 使用 `certbot/certbot` 为 `campusbook.top`、`www.campusbook.top`、`api.campusbook.top` 签发正式证书
  - 证书目录写入 `infra/nginx/.runtime/certbot/conf`
  - 证书当前到期时间：`2026-07-17`
  - 启用 `infra/docker-compose.https.yml` 后，`nginx` 已同时监听 `80/443`
- 为保证正式 HTTPS 行为正确，已顺序重建：
  - `api`，让 refresh token Cookie 在 `NODE_ENV=production` 下带上 `Secure`
  - `web`，让前端默认按页面协议推导 `api.campusbook.top`
- `scripts/smoke-live.mjs` 默认目标已切到 HTTPS 域名
- 真实 HTTPS 验证通过：
  - `http://campusbook.top` 返回 `301` 到 `https://campusbook.top`
  - `https://campusbook.top` 返回 `200`
  - `https://www.campusbook.top` 返回 `200`
  - `https://api.campusbook.top/health` 返回 `200`
  - 登录响应中的 refresh token Cookie 带 `Secure`
  - `pnpm smoke:live` 在 HTTPS 下通过
- 新增验证证据 `docs/verification/2026-04-18/ops-002-live-https-cutover.md`
- 完成 `OPS-002`：补齐 HTTPS-ready 配置、证书挂载约定与正式部署手册
- 新增 `infra/docker-compose.https.yml`
  - 为 `nginx` 增加 `443:443`
  - 挂载 Let’s Encrypt 证书目录
  - 通过 override 覆盖 `campusbook.conf`，避免与基础 HTTP 配置重复定义 `80` server block
- `infra/nginx/conf.d/campusbook.conf` 已补：
  - ACME challenge 路径
  - Docker DNS `127.0.0.11` 解析
  - 更稳定的 `X-Forwarded-*` 头透传
- 新增 `infra/nginx/https-conf.d/campusbook-https.conf.template`
  - 前端和 API 的 `443` server block
  - `80 -> 443` 跳转
  - Let’s Encrypt 证书路径
- 应用侧已补齐 HTTPS 切换关键点：
  - 前端 API 默认地址按页面协议推导 `api.campusbook.top`
  - `NODE_ENV=production` 时 refresh token Cookie 自动启用 `secure`
  - `ALLOWED_ORIGINS` 默认值已同时覆盖 HTTP 与 HTTPS 的前端域名
- 新增部署手册 `docs/standards/https-deployment-playbook.md`
- 轻量验证通过：
  - `docker compose -f infra/docker-compose.yml config`
  - `docker compose -f infra/docker-compose.yml -f infra/docker-compose.https.yml config`
  - 基础 HTTP `nginx -t`
  - 带临时自签证书的 HTTPS `nginx -t`
- 新增验证证据 `docs/verification/2026-04-18/ops-002-https-ready-baseline.md`
- 完成 `OPS-001`：补齐轻量 smoke test、CI test 保留位与回归样本
- 新增 `scripts/smoke-live.mjs`，默认校验：
  - `campusbook.top`
  - `www.campusbook.top`
  - `api.campusbook.top/health`
  - 学生登录后读取 `resources / activities / orders`
  - 管理员登录后读取 `admin/resources / admin/activities / admin/rules`
- 根命令新增：
  - `pnpm test`
  - `pnpm smoke:live`
- GitHub Actions 新增 `Test` 阶段，当前执行 `pnpm test`
- 真实 smoke 验证通过，计数结果：
  - `academicResources=1`
  - `activities=3`
  - `orders=6`
  - `adminResources=2`
  - `adminActivities=4`
  - `adminRules=3`
- 新增验证证据 `docs/verification/2026-04-18/ops-001-smoke-regression.md`
- 完成一次低频 compose 部署更新，将域名入口切到当前前后端版本
- 顺序执行：
  - `docker compose stop web api worker`
  - `docker compose build api`
  - `docker compose up -d api worker`
  - `docker compose build web`
  - `docker compose up -d web`
  - `docker compose restart nginx`
- 验证通过：
  - `api.campusbook.top/health` 返回 `200`
  - `campusbook.top` 返回最新前端 `index.html`
  - compose 常驻容器 `api / worker / web / nginx / postgres / redis` 全部恢复运行
- 新增验证证据 `docs/verification/2026-04-18/ops-live-compose-refresh.md`
- 完成 `APP-011`：将前端用户页与最小管理端页面接通真实 API
- 前端新增真实会话状态管理、`refresh` 恢复逻辑与角色路由守卫
- 新增页面：
  - `LoginPage`
  - `OrdersPage`
- 原有页面已从静态说明页升级为真实数据页：
  - `SpacesPage`
  - `SportsPage`
  - `ActivitiesPage`
  - `AdminPage`
- 前端 API 客户端已覆盖：
  - `auth`
  - `resources`
  - `reservations`
  - `activities`
  - `orders`
  - `admin/resources`
  - `admin/activities`
  - `admin/rules`
- 为前端补充最小后端支撑接口：
  - `GET /orders`
  - `GET /admin/resources`
  - `GET /admin/activities`
- 验证通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - `pnpm --filter web lint`
  - `pnpm --filter api typecheck`
  - `pnpm --filter api lint`
- 验证通过本机 `3001` 源码 API smoke：
  - 学生侧 `resources / activities / orders`
  - 管理员侧 `admin/resources / admin/activities / admin/rules`
- 新增验证证据 `docs/verification/2026-04-18/app-011-frontend-integration.md`
- 完成 `APP-010`：实现规则引擎初版，并接入学术空间与体育设施预约入口
- 新增 `RulesService`、`rule-engine` 与最小管理员规则接口：
  - `GET /admin/rules`
  - `POST /admin/rules`
  - `PATCH /admin/rules/:id`
  - `POST /admin/rules/:id/bindings/resources/:resourceId`
- 当前支持的规则类型：
  - `min_credit_score`
  - `max_duration_minutes`
  - `allowed_user_roles`
- `ReservationService` 已改为在创建学术空间和体育设施预约前，通过统一规则执行器校验
- `seed:demo` 已新增 3 条 demo 规则与资源绑定：
  - `rule_demo_academic_min_credit`
  - `rule_demo_academic_max_duration`
  - `rule_demo_sports_student_only`
- 验证通过：
  - 学生 60 分钟学术空间预约成功
  - 学生 180 分钟学术空间预约返回 `rule-max-duration-exceeded`
  - 管理员学术空间预约返回 `rule-min-credit-score-not-met`
  - 管理员体育设施预约返回 `rule-user-role-not-allowed`
- 新增验证证据 `docs/verification/2026-04-18/app-010-rules-engine.md`
- 完成 `APP-009`：补齐活动抢票的 Redis 预扣、BullMQ 异步建单、数据库库存兜底与同用户唯一性约束
- 新增 `ActivityRegistration` 模型与 migration `20260418101500_activity_registration_flow`
- 为 `ActivityRegistration(activityId, userId)` 增加仅针对有效状态的唯一索引，防止同用户重复报名
- 为 `ActivityTicket` 增加 `reserved <= stock` 检查约束，并在 worker 中使用条件更新做最终库存硬兜底
- 新增活动抢票接口：
  - `POST /activities/:id/grab`
  - `GET /activities/:id/registration-status`
- 新增 `ActivityRegistrationQueueService`、`ActivityRegistrationWorkerService` 与 `ActivityInventoryCacheService`
- 抢票请求已先走 Redis Lua 预扣，再进入 BullMQ 队列异步建单
- `OrdersService` 已支持活动报名订单取消时同步回写 `ActivityRegistration.status` 与票种库存
- 修复活动 worker 在首次访问 Redis 时可能触发的 lazy-connect 边界问题
- 新增验证证据 `docs/verification/2026-04-18/app-009-activity-grab.md`
- 完成 `APP-008B`：将超时取消从显式 HTTP 入口推进到 BullMQ delayed job 与独立 worker
- 新增 `OrderExpirationQueueService`，为待确认订单写入延迟取消任务并支持重建扫描
- 新增 `worker.ts` / `WorkerModule` / `OrderExpirationWorkerService`
- `ReservationService` 已在创建待确认订单后自动调度过期任务
- `OrdersService` 已在订单迁移出 `PENDING_CONFIRMATION` 后移除对应延迟任务
- `infra/docker-compose.yml` 已加入 `worker` 服务，并让 `api` / `worker` 共享同一运行时镜像
- 新增环境变量 `ORDER_PENDING_EXPIRE_SECONDS`，默认 `900`
- 新增验证证据 `docs/verification/2026-04-18/app-008b-delayed-expiry-worker.md`
- 完成 `DATA-001`：补齐 demo seed、资源/活动公共读接口与最小管理员维护入口
- 新增 `pnpm seed:demo`，可重复写入 demo 用户、资源、资源单元、组合资源与活动票种
- 新增公共接口：
  - `GET /resources`
  - `GET /resources/:id`
  - `GET /activities`
  - `GET /activities/:id`
- 新增管理员接口：
  - `POST /admin/resources`
  - `PATCH /admin/resources/:id`
  - `POST /admin/resources/:id/units`
  - `POST /admin/resources/:id/groups`
  - `POST /admin/activities`
  - `PATCH /admin/activities/:id`
  - `POST /admin/activities/:id/tickets`
- 验证通过 seed 连续执行两次成功，不依赖手工 SQL
- 验证通过学生无法调用 admin 写接口，管理员可维护资源与活动基础数据
- 新增验证证据 `docs/verification/2026-04-18/data-001-seed-and-read-api.md`
- 完成 `SEC-001`：为 API 增加可信身份上下文和最小权限边界
- 新增 `AccessTokenGuard`、`CurrentUser`、`RolesGuard`、`InternalJobGuard`
- `AuthService` 改为先将演示用户和管理员用户落库，再签发带 `user.id` 的 access token / refresh token
- 新增管理员演示账号环境变量 `DEMO_ADMIN_EMAIL`、`DEMO_ADMIN_PASSWORD`
- 新增内部任务令牌环境变量 `INTERNAL_JOB_TOKEN`
- 学术空间与体育设施预约接口已移除 `userEmail` 请求体身份来源，并统一改为信任 token 上下文
- 订单读取与取消动作已绑定用户本人或管理员权限
- 订单确认与爽约已收口为管理员动作
- `POST /orders/jobs/expire-pending` 已改为内部任务令牌保护
- 新增验证证据 `docs/verification/2026-04-18/sec-001-auth-boundaries.md`

### 当前状态

- 当前项目已从“主功能闭环”进入“产品化改造”阶段
- `feature-list.json` 中已新增 `PUX-001` 到 `PUX-005`
- 当前已完成：
  - `PUX-001` 设计系统与应用壳层
- 当前后续主线为：
  - `PUX-002` 用户端页面产品化收尾与浏览器验证
  - `PUX-003` 管理端后台产品化
  - `PUX-004` 响应式与状态设计收尾
  - `PUX-005` 浏览器级回归与最终留证
- `feature-list.json` 中的正式任务已全部通过
- 新会话恢复上下文的推荐入口已固定为：
  - `docs/progress/agent-progress.md`
  - `docs/plans/feature-list.json`
  - `docs/architecture/product-baseline.md`
  - `docs/standards/business-rules-baseline.md`
  - `docs/architecture/domain-model-baseline.md`
  - 必要时再回看 `docs/reference/`
- 仓库已具备可重复执行的 HTTPS 证书续期脚本，但宿主机定时调度仍属于可选运维增强项
- `OPS-002` 已通过，仓库已经具备 HTTPS-ready 的配置、证书挂载约定和切换手册
- 当前线上已经切到正式 HTTPS：
  - `campusbook.top`
  - `www.campusbook.top`
  - `api.campusbook.top`
- `nginx` 当前同时监听 `80/443`，并对前端与 API 的 HTTP 入口执行 `301 -> HTTPS`
- refresh token Cookie 已进入 `Secure` 模式
- 当前剩余的 HTTPS 运维事项主要是证书续期自动化，而不是首次切换本身
- `OPS-001` 已通过，仓库已具备可重复执行的 live smoke 脚本与最小回归样本
- CI 当前链路为：
  - `prisma:generate`
  - `lint`
  - `typecheck`
  - `test`
  - `build`
- `APP-011` 已通过，前端已从“说明性骨架”进入“可演示站点”阶段
- 用户端已具备：
  - 登录
  - 学术空间预约页
  - 体育设施预约页
  - 活动浏览与抢票入口
  - 我的订单
- 管理端已具备：
  - 资源创建
  - 资源单元创建
  - 活动创建
  - 票种追加
  - 活动状态切换
  - 规则快照查看
- 当前域名入口已经完成低频部署更新：
  - `campusbook.top` / `www.campusbook.top` 提供最新前端静态站点
  - `api.campusbook.top` 提供最新 API 与 worker 配套后端
- 本轮部署采用顺序构建与单服务重启，避免了全栈同时重建导致的内存尖峰
- `APP-010` 已通过，规则引擎已经从模型占位进入可执行状态
- 当前预约主流程已不再把信用分、时长和身份差异规则硬编码在接口里，而是统一走规则执行器
- 规则配置表已具备最小管理员维护入口，可继续为 `APP-011` 的管理端页面提供真实 API
- `APP-009` 已通过，活动抢票已经具备异步受理与最终库存兜底
- API 已具备活动报名状态查询接口，可为后续前端活动页接入真实状态
- 本轮为了控制单机负载，活动链路验证使用的是本机临时 `3001` 端口 API 与本机 worker，未重建 compose 镜像
- 当前 compose 常驻栈仍可继续作为 PostgreSQL / Redis / Nginx / Web 基线使用；若要让容器内 API/worker 直接使用 `APP-009` 最新代码，需要在后续合适时机单独重建
- `APP-008B` 已通过，超时取消已不再依赖手动 HTTP 触发
- 仓库已经具备独立 worker 进程基线，后续活动抢票可以直接复用同一模式
- `DATA-001` 已通过，前端联调不再依赖手工 SQL 插库
- API 已具备资源、活动的公共读接口和最小管理员维护入口
- 当前公共活动列表由 `published` 状态驱动，管理员修改活动状态后可立即影响公共可见性
- `SEC-001` 已通过，`feature-list` 已同步更新
- API 已具备用户、管理员、内部任务三类最小权限边界

### 下一步建议

1. 为 Let’s Encrypt 证书续期补自动化任务，并约定续期后的 `nginx` reload 流程
2. 交付前补一轮前端真实浏览器回归与管理端操作样本
3. 按 smoke 脚本为基础继续扩展更细的业务回归样本

### 注意事项

- 当前机器内存余量有限；继续验证前端或 API 新功能时，优先选择 `typecheck / lint / build` 与本机临时源码进程，不要频繁 `docker compose build`
- 当前 Nginx 对容器 upstream 的解析在 `api` 容器重建后可能短暂命中旧 IP；后续交付前应补一版更稳的容器 DNS 解析配置
- 当前 seed 脚本默认使用本机 `127.0.0.1:5432` 的 PostgreSQL 作为兜底连接；若后续端口或数据库名变化，需要同步更新
- 演示环境中的 `DEMO_ADMIN_*` 与 `INTERNAL_JOB_TOKEN` 仅用于当前开发基线，正式部署前必须替换
- 后续新增需要写入状态的接口时，不要重新引入请求体身份字段，统一从鉴权上下文取用户身份
- 活动 worker 依赖 Redis 真实可写连接；后续新增基于 `RedisService.raw` 的业务逻辑时，优先使用 `RedisService.connect()` 保证首次调用不会踩到 lazy-connect 边界
- 规则表达式当前采用结构化 JSON，而不是通用 DSL；后续扩展时优先保持显式结构，避免过早引入难以验证的表达式求值器
- `infra/nginx/.runtime/` 属于运行时目录；正式证书、ACME challenge 文件和临时 HTTPS 产物都不进入 git
- `scripts/smoke-live.mjs` 当前默认面向 HTTPS 线上环境；如需验证纯 HTTP 或本机环境，应通过 `SMOKE_*` 环境变量覆盖

### 工具补充

- 新增仓库内 skill `skills/harness-best-practice`
- skill 提供仓库级 docs harness 初始化脚本 `scripts/bootstrap_docs_harness.py`、模板资产与使用说明
- 默认生成 `docs/plans`、`docs/progress`、`docs/standards`、`docs/adr`、`docs/verification`、`docs/exec-plan`、`docs/reference` 及缺失时的最小 `AGENTS.md`
- 已通过 `quick_validate`、脚本编译检查以及 `/tmp/harness-best-practice-smoke` 临时仓库 dry-run / 实际生成验证
- 新增验证证据 `docs/verification/2026-04-18/skill-harness-best-practice.md`

## 2026-04-17

### 已完成

- 完成 `APP-003`：为 API 接入全局 `ConfigModule` 与环境变量校验
- 新增 `InfrastructureModule`、`PrismaService`、`RedisService`
- 将 `GET /health` 从静态占位改为真实检测 PostgreSQL 与 Redis 状态
- 修复 Prisma 在容器运行时的 OpenSSL 兼容问题：
  - `infra/docker/api.Dockerfile` 改为 `node:20-bookworm-slim`
  - 镜像构建期显式安装 `openssl`
- 验证通过 `api.campusbook.top/health` 返回 `postgres=up`、`redis=up`
- 新增验证证据 `docs/verification/2026-04-17/app-003-prisma-health.md`
- 完成 `APP-004`：新增 `login`、`refresh`、`logout` 认证接口
- 接入 `@nestjs/jwt` 与 `cookie-parser`，access token 走响应体，refresh token 走 `HttpOnly` Cookie
- 新增演示账号环境变量 `DEMO_USER_EMAIL`、`DEMO_USER_PASSWORD`、`DEMO_USER_ROLE`
- 验证通过登录、刷新令牌、退出与退出后 refresh 失效
- 新增验证证据 `docs/verification/2026-04-17/app-004-auth-cookie-flow.md`
- 为后续 `autonomous` 开发补充仓库级安全规则，禁止危险删除并限制默认操作边界
- 完成 `APP-005`：扩展 Prisma schema，补齐用户、资源、资源单元、活动、订单等核心数据模型
- 新增首轮 migration `20260417015325_init_core_models` 并成功应用到 PostgreSQL
- 同步扩展共享类型中的核心枚举与实体接口
- 新增验证证据 `docs/verification/2026-04-17/app-005-core-data-model.md`
- 完成 `APP-006`：新增学术空间预约模型、接口与事务写入骨架
- 新增 migration `20260417020123_academic_reservation_flow`，为学术空间预约引入数据库排斥约束
- 验证通过正常预约、缓冲区冲突以及数据库层防重叠兜底
- 新增验证证据 `docs/verification/2026-04-17/app-006-academic-reservation.md`
- 完成 `APP-008`：补齐订单状态机服务、状态迁移接口与超时取消入口
- 验证通过 `PENDING_CONFIRMATION -> CONFIRMED -> NO_SHOW` 链路
- 验证通过超时取消将订单迁移到 `CANCELLED`
- 新增验证证据 `docs/verification/2026-04-17/app-008-order-state-machine.md`
- 完成 `APP-007`：新增体育设施槽位预约与组合预约接口
- 新增 migration `20260417023023_sports_slot_booking`，引入 `SportsReservationSlot` 模型与有效占用唯一索引
- 验证通过单资源预约、组合预约、任一单元冲突时整单失败
- 验证通过订单取消后体育槽位状态同步为 `CANCELLED`，槽位可重新释放
- 新增验证证据 `docs/verification/2026-04-17/app-007-sports-reservation.md`
- 新增 `scripts/watchdog.sh`，用于监控 tmux pane 静默状态并按上限自动发送 `continue`
- watchdog 支持 `-n` 参数控制最多自动继续轮数，并支持轮询间隔、静默阈值、阻断正则与日志路径配置
- 通过临时 tmux pane 验证 watchdog 在静默后发送 1 次消息并按上限正常退出
- 结合最新 review 调整后续主线顺序：
  - `SEC-001`：先绑定可信身份上下文并收口订单/任务权限
  - `DATA-001`：补 demo seed、资源列表/详情 API 与最小管理入口
  - `APP-008B`：补 worker、BullMQ delayed job 与幽灵支付保护
  - 再推进 `APP-009`、`APP-010`、`APP-011`
- 复查 GitHub Actions 最近失败 run，确认失败点位于 `Build`
- 通过 check annotations 确认直接原因是 CI 新环境未生成 Prisma Client：
  - `@prisma/client` 在 fresh install 下没有读取 `apps/api/prisma/schema.prisma`
  - 导致 `PrismaClient`、`OrderStatus`、`$transaction`、`order` 等类型在构建期缺失
- 已在 `.github/workflows/ci.yml` 中显式补上 `pnpm prisma:generate` 与 `pnpm typecheck`
- 本地已验证 `pnpm prisma:generate`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过
- 已将单机 `2 vCPU / 2 GiB RAM` 的资源保护约束写入 `docs/standards/deployment-baseline.md`
- 继续追踪 GitHub Actions 的 `typecheck` 失败，确认 `apps/web` 在 CI 中找不到 `@campusbook/shared-types`
- 直接原因是 `packages/shared-types/package.json` 将类型入口指向 `dist/index.d.ts`，而 CI 在 `typecheck` 阶段尚未构建该包
- 已将 `@campusbook/shared-types` 的 `types` 与 `exports.types` 切换到 `src/index.ts`
- 本地已验证 `pnpm --filter web typecheck` 与根级 `pnpm typecheck` 通过

### 当前状态

- `APP-001`、`APP-002`、`APP-003`、`APP-004`、`APP-005`、`APP-006`、`APP-007`、`APP-008` 已通过
- API 已具备真实依赖健康检查能力和最小认证闭环
- 数据库已具备统一资源、活动、订单主数据骨架和学术空间预约防重叠约束
- 订单状态机已经具备状态日志与可执行超时取消入口
- 体育设施已具备离散槽位预约、组合预约与数据库层冲突兜底
- 当前认证实现仍是演示账号模式，后续需接入正式用户模型
- 当前预约与订单接口仍未完全绑定可信身份上下文
- 当前延迟取消仍停留在显式任务入口，尚未落到独立 worker
- 当前 Compose 栈仍保持运行，可用于下一阶段最小范围联调

### 下一步建议

1. 按规则先抽样回归一个已通过核心流程
2. 先执行 `SEC-001`，移除写接口中的 `userEmail` 身份来源并收口公开状态迁移入口
3. 再执行 `DATA-001` 与 `APP-008B`
4. 然后推进 `APP-009`、`APP-010`、`APP-011`

### 注意事项

- Prisma 运行时依赖镜像内的 `openssl`；后续调整 API 基础镜像时需一并保留
- 对本地 `127.0.0.1:80` 的 Nginx 验证仍需使用提权命令
- 完成新的阶段性功能后，继续按“留证据 -> 更新状态 -> git 提交”的顺序收口

## 2026-04-16

### 已完成

- 初始化 git 仓库
- 建立 docs 执行层目录：`plans/`、`progress/`、`standards/`、`adr/`
- 新增目录导航、任务清单、git 工作流、工程规则、ADR 模板、初始化脚本
- 保留现有 `docs/reference/` 资料作为输入层
- 新增 agent 长周期执行规则文档 `docs/standards/agent-harness-rules.md`
- 新增部署基线文档 `docs/standards/deployment-baseline.md`
- 记录 harness-first 工作流 ADR 与域名分流 ADR
- 固化 `campusbook.top` / `www.campusbook.top` / `api.campusbook.top` 的部署域名结构
- 修正仓库根 README 中过期的绝对路径链接
- 新增 `docs/architecture/`，归档技术方案 V1 并产出修订版 V2
- 新增架构图文档与开发环境核查文档
- 记录单机 TypeScript 平台基线 ADR `0004`
- 初始化 monorepo 根配置、`pnpm workspace` 与共享包骨架
- 新增 `apps/web` React + Vite 前端基础工程
- 新增 `apps/api` NestJS 后端基础工程与 Prisma 初始 schema
- 新增 `infra/docker-compose.yml`、Nginx 域名分流配置与最小 GitHub Actions CI
- 生成 `pnpm-lock.yaml` 并完成首轮依赖安装
- 验证通过 `pnpm lint`、`pnpm build`
- 验证通过 `docker compose -f infra/docker-compose.yml build web api`
- 固化“先回归，再开发”规则
- 新增 `docs/verification/README.md` 作为验证证据落位规范
- 固化会话结束前更新状态、记录证据并保持工作区干净的退出条件
- 修复 `api` 容器产物输出路径问题，将生产构建切换为 `tsc -p tsconfig.json`
- 验证通过整套 Compose 启动与基础 HTTP 联调
- 新增验证证据 `docs/verification/2026-04-17/foundation-stack-connectivity.md`
- 将 `docs/plans/feature-list.json` 重写为面向当前应用开发主线的新任务清单

### 当前状态

- 仓库已经具备基础协作骨架
- 已存在可继续开发的前后端与基础设施代码骨架
- 已形成 agent 执行规则与部署基线的长期文档入口
- 已形成回归优先、验证证据和干净结束的长期规则
- 域名分流规则已明确为前端裸域与 `www`，后端 `api` 子域
- 已形成当前推荐技术方案 V2 与配套架构图
- 当前服务器已激活 `pnpm` 并具备单机开发所需的基础依赖
- 已具备基础 Nginx 与 Compose 配置，且整套容器已完成首次联调
- `campusbook.top`、`www.campusbook.top`、`api.campusbook.top` 的 HTTP 路由已验证通过
- 当前仍未启用 HTTPS，数据库与缓存也尚未接入真实业务逻辑
- 当前 `feature-list` 已切换为以应用交付为主的 `APP/OPS/DOCS` 任务结构

### 下一步建议

1. 为 API 增加真实数据库连接、配置模块与 Prisma Service
2. 开始实现认证、资源建模与预约主流程
3. 为基础联调补充自动化健康检查或 smoke test
4. 后续按同一域名结构补齐 HTTPS
5. 逐步将参考资料映射为更细化的正式产品与技术文档

### 注意事项

- 后续 agent 开始工作前，先读本文件和 `docs/plans/feature-list.json`
- 每次只推进一个高优先级任务，避免同时改太多内容
