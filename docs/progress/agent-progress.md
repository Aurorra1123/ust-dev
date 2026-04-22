# Agent Progress Log

本文件用于跨会话交接，任何一次较完整的工作结束前都应更新。

## 2026-04-22

### 已完成

- 已新增“面向比赛 PDF 要求的整改计划”文档：
  - `docs/review/2026-04-22-pdf-requirement-improvement-plan.md`
- 新文档已把以下输入收口为一份执行计划：
  - 比赛 PDF 硬要求
  - 核心偏题审查
  - 最终验收与模拟打分
  - 当前实现审计
  - 测试自动化计划
- 整改计划已明确分阶段顺序：
  - `Phase 0` 保住当前已做对的数据库约束与强项
  - `Phase 1` 优先补订单状态机、`PENDING_CONFIRMATION`、`PaymentRecord`、幽灵支付
  - `Phase 2` 修补活动高并发库存一致性与 `totalQuota`
  - `Phase 3` 将规则执行器提升为责任链并接入处罚闭环
  - `Phase 4` 补前端响应式、`WCAG 2.2`、`Core Web Vitals` 证据
  - `Phase 5` 补真实测试、CI、judge 与验证留证
  - `Phase 6` 收口答辩与演示表达

### 当前状态

- `docs/review/` 目录现在已同时包含：
  - 赛题核心偏题审查
  - 最终验收与模拟打分
  - 测试自动化计划
  - 面向比赛 PDF 要求的整改计划
- 当前这份整改计划仍是文档层交付，尚未开始业务代码整改

### 下一步建议

1. 按整改计划先落 `Phase 1`，优先补订单真实 pending 主链路与幽灵支付
2. 并行补 `Phase 2` 的活动库存一致性，避免继续在高并发项失分
3. 代码开始落地后，同步把第一批验证结果写入 `docs/verification/`

### 注意事项

- 本轮只新增整改计划文档并更新进度记录，没有修改业务代码、数据库 schema 或部署脚本
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

### 已完成

- 已把赛题核心偏题审查的后续整改方向正式落为计划文档：
  - `docs/plans/competition-gap-closure-plan-2026-04-22.md`
- 已新增 ADR，明确为什么先用付费活动票而不是重写全部预约链路来打通支付闭环：
  - `docs/adr/0018-paid-activity-ticket-is-the-first-payment-closeout-path.md`
- 已把新的比赛收口任务正式写入 `feature-list.json`：
  - `COMP-001`
  - `COMP-002`
  - `COMP-003`
  - `COMP-004`
  - `COMP-005`
- 已确定统一业务样例：
  - 活动：`红鸟音乐节`
  - 票种：`普通票`
  - 售价：`5` 元，即 `priceCents = 500`

### 当前状态

- 当前仓库不再只有“review 结论”，已经形成一份可直接执行的比赛缺口收口计划。
- 下一阶段的重点不再模糊，已经正式收敛为：
  - 付费活动票支付闭环
  - 幽灵支付对撞保护
  - 规则引擎 v2
  - 前端非功能留证
  - 核心业务自动化测试

### 下一步建议

1. 先实施 `COMP-001`，把 `红鸟音乐节 5 元普通票` 的待支付主链路真正打通
2. 紧接着实施 `COMP-002`，避免支付回调和延迟取消之间继续停留在“有骨架、没闭环”
3. 在支付链路稳定后，再推进 `COMP-003` ~ `COMP-005`

### 注意事项

- 本轮只新增计划文档、ADR 与任务清单，没有修改业务代码、数据库 schema 或部署脚本
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-22

### 已完成

- 已新增测试自动化计划文档：
  - `docs/review/2026-04-22-test-automation-plan.md`
- 文档已按当前真实代码边界整理四层测试策略：
  - API 集成测试
  - 系统级异步测试
  - 浏览器级 E2E / a11y / 响应式测试
  - 红灯规格测试
- 已把当前最值得优先自动化的场景正式落表，包括：
  - 学术空间 `5` 分钟缓冲冲突
  - 体育 slot 唯一与组合资源原子性
  - 活动抢票高并发不超卖
  - 订单异步骨干与 worker 依赖
  - 规则引擎边界值与动态启停
  - 越权边界与 demo 账号认证风险
- 已明确本轮计划边界：
  - 先写测试自动化计划，不在本轮直接引入测试框架或新增业务测试代码
  - 支付闭环、幽灵支付与处罚链路先列为红灯规格，不误写成“当前已可转绿”的常规回归

### 当前状态

- `docs/review/` 目录现在已同时包含：
  - 赛题核心偏题审查
  - 最终验收与模拟打分
  - 测试自动化计划
- 当前仓库关于“测试怎么补”的结论已经从聊天建议收口为正式计划文档
- 后续如果开始真实补测试，可直接以该计划里的 `API-* / SYS-* / E2E-* / RED-*` 清单为执行入口

### 下一步建议

1. 先从计划中的首批 `12` 项下手，优先建立 API 集成测试骨架
2. 再补 worker / delayed job / judge 的系统级异步测试，避免异步骨干挂了但 smoke 仍报绿
3. 最后补 Playwright + axe 的浏览器级测试，把 a11y / 响应式 / 前端主路径证据补齐

### 注意事项

- 本轮只新增 review 文档与进度记录，没有修改业务代码、数据库 schema 或部署脚本
- 当前仓库依然没有真实业务测试文件，本轮新增的是测试计划，不是测试实现
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-22

### 已完成

- 已新增最终验收与模拟打分审查文档：
  - `docs/review/2026-04-22-final-acceptance-and-scoring.md`
- 本轮严格审查覆盖：
  - 领域建模与数据库约束
  - 学术空间 / 体育设施预约链路
  - 活动抢票高并发链路
  - 订单状态机、延迟任务与签到爽约逻辑
  - 规则引擎
  - 用户端前端主路径、响应式与可访问性风险
  - CI、judge 启动脚本与 smoke
- 已完成本地只读校验：
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
- 本轮已确认：
  - `pnpm test` 当前为空跑
  - 仓库没有真实业务测试文件

### 当前状态

- `docs/review/` 目录现在已同时包含：
  - 赛题核心偏题审查
  - 最终验收与模拟打分
- 当前项目结论不是“不能演示”，而是“仍有明显缺口，尤其是支付一致性、自动化测试、WCAG 与 CWV 证据”

### 下一步建议

1. 优先补订单待确认与支付闭环，让 `PENDING_CONFIRMATION / expireAt / PaymentRecord / 幽灵支付` 进入正式主链路
2. 为预约冲突、活动抢票、取消、签到和规则生效补真实自动化测试
3. 补做 Docker Compose judge 模式现场拉起验证，并把结果写入 `docs/verification/`
4. 补前端 a11y 与性能验收证据，至少形成 WCAG / Lighthouse / CWV 的可追溯记录

### 注意事项

- 本轮只新增 review 文档与进度记录，没有修改业务代码
- Docker Compose judge 模式现场拉起验证本轮按用户要求暂缓，尚未补证
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-22

### 已完成

- 已新增赛题核心偏题审查文档：
  - `docs/review/2026-04-22-core-topic-review.md`
- 文档中已落地两部分内容：
  - 本轮实际采用的审查任务说明整理版
  - 对照赛题核心点的 review 结果与评委视角结论
- 已明确保留边界：
  - 没有写入系统 / 开发者隐藏 prompt 原文
  - 改为记录本轮真实审查口径与输出要求
- 已补做最小核查留痕：
  - `pnpm test`
  - 结果显示仓库当前没有真实业务测试用例输出，主要只是 workspace 级扫描

### 当前状态

- `docs/review/` 目录现已建立
- 当前仓库已经存在一份可直接给项目成员回看和继续补缺口的“赛题核心偏题审查”记录

### 下一步建议

1. 如果要继续打磨参赛答辩，可把这份审查再拆成“得分点矩阵 + 缺口整改清单”
2. 若要继续补核心短板，优先补：
   - 真实支付 / `PENDING_CONFIRMATION` 主链路
   - 幽灵支付对撞闭环
   - 更完整的规则引擎与前端非功能验收证据

### 注意事项

- 本轮只新增 review 文档与进度记录，没有修改业务代码、数据库 schema 或部署脚本
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-22

### 已完成

- 已完成管理员端剩余两项正式任务 `ADM-008` 与 `ADM-009`：
  - `ADM-008`
    - 资源页已补齐资源基础信息编辑能力
    - 资源单元已补齐编辑能力，不再停留在只能新增和删除
    - 资源与资源单元表单中的关键字段都已补常驻说明，不再主要依赖 `placeholder`
    - 后端已补最小资源单元更新接口，未改数据库 schema
  - `ADM-009`
    - 活动创建首屏已继续收口，只突出标题、地点、总额度
    - 售卖时间、活动时间、总额度、首票价格与新增票种价格都已补常驻说明
    - 自定义首票与进阶设置仍维持折叠结构，没有把页面重新拉回重表单状态
- 已完成本地校验并留证：
  - `pnpm --filter api lint`
  - `pnpm --filter api typecheck`
  - `pnpm --filter api build`
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-22/adm-008-adm-009-admin-form-crud-and-activity-lightweighting.md`

### 当前状态

- `feature-list.json` 中当前正式开发任务已全部完成，没有剩余 `passes: false` 的正式项
- 管理员端当前基线已经形成三层稳定边界：
  - 资源页：资源与资源单元基础 CRUD
  - 规则页：规则配置与按业务域绑定
  - 活动页：保留主链路，但首屏认知负担继续收口

### 下一步建议

1. 若继续做演示完善，可补管理员端三类截图：
   - 资源编辑与资源单元编辑
   - 规则配置双域切换
   - 活动创建首屏与进阶设置展开态
2. 若继续做产品回访，可再决定是否要把规则模型长期补成显式业务域字段，而不是只靠前端分域显示

### 注意事项

- 本轮没有修改数据库 schema，也没有新增迁移
- 本轮沿用 `docs/adr/0017-admin-form-scope-reduced-to-core-operations.md`，没有新增 ADR
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-22

### 已完成

- 已在 `docs/architecture/architecture-diagrams.md` 中补充两张基于当前 Prisma schema 的 ER 图：
  - 完整业务 ER 图
  - 面向汇报的简化版核心 ER 图
- 已将“管理员表单收口”正式落文档：
  - `docs/architecture/admin-form-simplification-plan-2026-04-22.md`
- 已新增 ADR：
  - `docs/adr/0017-admin-form-scope-reduced-to-core-operations.md`
- 已同步结构化开发列表，新增 `ADM-008` 与 `ADM-009`：
  - 资源页基础 CRUD 补齐与表单说明增强
  - 活动管理页轻量表单收口与常驻字段提示
- 已更新架构文档导航：
  - `docs/architecture/README.md`

### 当前状态

- 管理员端新的简化基线现在已经不只覆盖“首页和规则中心怎么分”，还进一步明确了：
  - 资源页只保留资源与资源单元维护表单
  - 规则页只保留规则配置表单，并按学术 / 体育分域
  - 活动页继续保留现有业务链路，但表单首屏要继续减负

### 下一步建议

1. 优先实施 `ADM-008`，补齐资源页编辑能力和字段常驻说明
2. 再实施 `ADM-009`，继续减轻活动创建页的理解负担
3. 如果后续继续补演示证据，可追加管理员端“资源编辑 / 规则分域 / 活动表单提示”三类截图

### 注意事项

- 本轮只有文档、ADR 与计划更新，没有修改业务代码
- 本轮是对 `0016` 的继续细化，不替代“规则中心恢复”和“首页轻量化”的既有结论

### 已完成

- 已完成管理员端后续三项正式任务 `ADM-005` ~ `ADM-007`：
  - `ADM-005`
    - 运营总揽已收口为轻量入口页
    - 首页现在只保留 5 个主入口卡片与 3 个待处理数字卡
    - 已删除统计总览、结构说明、步骤说明与对象快照等重内容区块
  - `ADM-006`
    - 管理员一级导航已恢复 `规则配置`
    - 体育场馆页与学术空间页已移除关闭规则、开放策略、批量作用资源与预约状态控制
    - 资源页职责已收口为资源与资源单元维护
  - `ADM-007`
    - 规则配置页已拆为 `学术空间规则 / 体育场馆规则` 两个域内切换
    - 规则页资源绑定现在只展示当前域资源，不再体育与学术混排
    - 原三栏式规则控制台已收口为“规则列表 + 规则编辑器”两栏
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-22/adm-005-adm-007-overview-and-rules-center.md`

### 当前状态

- 管理员端当前信息架构已经稳定为：
  - `运营总揽`
  - `体育场馆`
  - `学术空间`
  - `规则配置`
  - `活动管理`
  - `通知发布`
  - `工单维修`
- 运营总揽不再承担报表式首页职责，而是只保留主入口和待处理提示
- 资源页与规则页的职责边界已重新收口：
  - 资源页只做资源与资源单元维护
  - 规则页只做规则创建、编辑、启停和绑定

### 下一步建议

1. 若继续补演示证据，可增加管理员端四类截图：
   - 轻量运营总揽
   - 体育场馆资源维护页
   - 学术空间分区页
   - 规则配置双域切换页
2. 若后续继续产品化回访，可再审视规则模型是否需要长期补“业务域”显式字段，而不是继续仅靠前端分域展示

### 注意事项

- 本轮只改前端管理员工作台，没有修改 API、数据库或 Prisma schema
- 本轮沿用 `docs/adr/0016-admin-overview-simplified-and-rule-center-restored.md`，没有新增 ADR
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-22

### 已完成

- 已根据新的管理员前端方向，新增正式方案文档：
  - `docs/architecture/admin-overview-and-rule-center-simplification-plan-2026-04-22.md`
- 已新增 ADR：
  - `docs/adr/0016-admin-overview-simplified-and-rule-center-restored.md`
- 已补充旧方案文档说明：
  - `docs/architecture/admin-frontend-restructure-plan-2026-04-21.md` 已注明其关于规则下线与首页结构的旧结论已被新方案覆盖
- 已同步结构化开发列表，新增 `ADM-005` 至 `ADM-007`：
  - 运营总揽轻量化
  - 恢复独立规则配置栏目
  - 规则配置页按学术 / 体育分域并简化布局
- 已更新架构文档导航：
  - `docs/architecture/README.md`

### 当前状态

- 管理员端“体育场馆 / 学术空间”拆分仍然保留
- 但关于“规则栏目从一级导航完全下线”的结论已不再适用，当前新基线是：
  - 运营总揽做轻量入口页
  - 资源页只做资源维护
  - 规则能力恢复为独立栏目，并按学术 / 体育拆分

### 下一步建议

1. 先实施 `ADM-005`，把运营总揽收口为 5 个主入口卡片和 3 个待处理数字卡
2. 再实施 `ADM-006`，把规则和调度相关块从体育场馆 / 学术空间页面剥离
3. 最后实施 `ADM-007`，重建简化版规则配置中心

### 注意事项

- 本轮只有文档与计划更新，没有修改业务代码
- `ADM-004` 作为“规则下线”的历史完成项保留，但已被新的 2026-04-22 决策部分覆盖

## 2026-04-22

### 已完成

- 已完成管理员端业务域重组的四个正式任务 `ADM-001` ~ `ADM-004`：
  - `ADM-001`
    - 管理员一级导航已从旧的 `resources / rules / activities / notifications / serviceRequests` 收口为：
      - `运营总揽`
      - `体育场馆`
      - `学术空间`
      - `活动管理`
      - `通知发布`
      - `工单维修`
    - 运营总揽中的快捷入口、模块文案与步骤说明已同步到新结构
  - `ADM-002`
    - 原 `ResourcesWorkspace` 已收口为共享资源域底座
    - 前端已新增 `SportsVenuesWorkspace` 与 `AcademicSpacesWorkspace` 两个独立入口
    - 体育场馆页只展示 `sports_facility`，学术空间页只展示 `academic_space`
  - `ADM-003`
    - 学术空间页已增加按资源 `code` 前缀进行 `E1 / E2 / E3 / E4 ...` 区域切换的前端分组能力
    - 不符合命名规则的资源会进入 `未分区 / Ungrouped`
  - `ADM-004`
    - 规则工作区已从管理员一级导航下线
    - 现有规则后端接口、模型与执行能力没有删除，仍由 ADR 保持边界
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-22/adm-001-adm-004-admin-domain-workspace-split.md`

### 当前状态

- 管理员端前端已经切换到以业务域为中心的新信息架构
- 资源管理主路径已经从“混合资源工作区”拆成“体育场馆 / 学术空间”两条独立路径
- 规则系统当前仍保留在后端，但不再继续作为管理员一级主路径能力暴露

### 下一步建议

1. 若要继续做演示收尾，可补一组管理员端截图，覆盖“新导航 / 体育场馆页 / 学术空间分区页”三类场景
2. 若后续要继续深化后台产品化，可再评估是否需要为组合场地和规则恢复设计次级入口，而不是重新回到一级主导航

### 注意事项

- 本轮只改前端信息架构与页面组织，没有修改 API、数据库或 Prisma schema
- 本轮沿用既有 ADR `docs/adr/0015-admin-workspace-split-by-business-domain.md`，没有新增 ADR
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已根据管理员端新的重组方向，新增正式方案文档：
  - `docs/architecture/admin-frontend-restructure-plan-2026-04-21.md`
- 已新增 ADR：
  - `docs/adr/0015-admin-workspace-split-by-business-domain.md`
- 已同步结构化开发列表，新增 `ADM-001` 至 `ADM-004`：
  - 管理员一级模块重组
  - 资源工作区拆分为体育场馆与学术空间
  - 学术空间按 `E1 / E2 / E3 / E4 ...` 分组
  - 规则工作区从一级导航下线
- 已更新架构文档导航：
  - `docs/architecture/README.md`

### 当前状态

- 管理员前端新的目标信息架构已经正式落文档，不再只存在于聊天记录中
- 当前还没有开始业务代码改造，现状仍然是旧的 `overview / resources / activities / rules / notifications / serviceRequests`
- `feature-list.json` 在本轮更新前已经被推进到更高状态：`UTG-011`、`UTG-012` 当前已被标记为通过，本轮没有回退这些现有记录

### 下一步建议

1. 先实施 `ADM-001`，完成管理员端一级导航和模块命名切换
2. 再推进 `ADM-002` 与 `ADM-003`，把资源工作区按体育 / 学术拆开，并为学术空间接入区域分组
3. 最后处理 `ADM-004`，从主导航收口规则入口并做一次后台主路径回归

### 注意事项

- 本轮只有文档与计划更新，没有修改业务代码
- 工作区中仍存在未跟踪的 `apps/web/src/ui/pages/admin/workspaces/resources/` 与 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已完成第二轮用户反馈残余问题 `UTG-013`：
  - 已确认学术空间、活动与报修工单英文页里的中文残留，根因主要不在页面主体，而在共享学生端壳层 `apps/web/src/ui/app-shell.tsx`
  - 学生端顶部品牌文案现在会随 `locale` 切换，英文模式不再固定显示 `CampusBook 智约校园`
  - 语言切换按钮已改为随当前语言显示 `中文 / 英文` 或 `Chinese / English`，英文模式不再固定露出 `中文`
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-013-student-shell-english-locale-cleanup.md`

### 当前状态

- 第二轮用户反馈中可直接由代码确认并快速闭环的英文壳层残留已完成
- 学生端 `/spaces`、`/activities`、`/service-requests` 在英文模式下不再通过共享壳层露出固定中文品牌或语言切换文案

### 下一步建议

1. 若继续做产品回访，可用浏览器实测确认剩余中英混杂是否只剩业务数据正文或 seed 内容
2. 再决定是否把“羽毛球单场地 / 组合场地问题仍然存在”正式升级为新的开发项

### 注意事项

- 本轮只改前端共享壳层，没有变更 API、数据库或 demo seed
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已完成第二轮用户测试确认问题 `UTG-011` 与 `UTG-012`：
  - `UTG-011`
    - 学术空间学生端现在会对零单元资源显示明确空状态，不再出现近似空白时间轴
    - 后端公开资源边界已收口为“`active` 且至少存在一个资源单元”，零单元资源不再直接面向学生公开
    - 管理端资源工作区已补“未配置单元 / 当前不会形成学生侧时间轴”的明显提示
  - `UTG-012`
    - 后端已新增 `DELETE /admin/resources/closures/:id`
    - 管理端资源工作区已为每条关闭规则补“删除关闭规则”入口、确认提示和成功/失败反馈
- 已新增 ADR：
  - `docs/adr/0015-public-resource-must-have-units-before-student-exposure.md`
- 已完成本地校验并留证：
  - `pnpm --filter api lint`
  - `pnpm --filter api typecheck`
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter api build`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-011-utg-012-resource-completeness-and-closure-delete.md`

### 当前状态

- 第二轮用户测试中当前已确认的两条 P0 问题 `UTG-011`、`UTG-012` 已完成
- `docs/plans/feature-list.json` 中这两项现在可标记为通过

### 下一步建议

1. 若要继续压缩演示风险，可补一组浏览器级截图，覆盖“零单元资源隐藏 / 后台关闭规则删除”两个场景
2. 若后续继续做产品回访，可复查此前暂未纳入正式开发列表的第二轮用户反馈项

### 注意事项

- 本轮没有修改线上数据库或 demo seed；对线上零单元资源的收口依赖本轮代码发布后生效
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已完成代码质量重构第五阶段的 HTTP fallback 清理：
  - `apps/web/src/lib/http/client.ts` 已移除对未知 hostname 默认猜到 `api.campusbook.top` 的分支
  - 当前只保留正式域名与本地开发环境的已确认默认推导，其他环境必须显式配置 API 地址
  - 已在 `docs/standards/deployment-baseline.md` 补充长期规则，避免后续重新引入猜测性 fallback
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/code-quality-fifth-phase-http-fallback-cleanup.md`

### 当前状态

- 基线文档中本轮代码质量重构的五个主要方向已经全部落地
- 当前前端代码不再继续扩散大页面职责混杂、错误契约字符串化与未知 host 猜测性 fallback

### 下一步建议

1. 若后续继续做质量回访，可针对 `order-utils.tsx` 中 `no_show` 的语义漂移单独做产品决策
2. 若要补演示证据，可增加学生端预约页与后台工作区的浏览器级截图或录屏

### 注意事项

- 本轮没有新增 ADR，因为实现仍完全沿用 `docs/adr/0009-code-quality-refactor-boundaries.md` 已确认的长期边界
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已完成代码质量重构第四阶段中的前端错误契约收口：
  - `apps/web/src/lib/http/errors.ts` 已新增统一的 `getErrorMessage / getErrorStatus / getErrorCode`
  - `ApiError` 现在会在前端侧统一推导稳定 `code`，页面不再自己猜测 message 是否可当机器码
  - 学生端主要页面、后台工作区和 `MutationState` 已改为通过统一 helper 读取错误信息
  - 资源/规则相关 mutation 的错误分支已从按 `message` 判断切到按 `code` 判断
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/code-quality-fourth-phase-error-contract.md`

### 当前状态

- 前端错误读取边界已经基本统一，页面层不再继续扩散 `as ApiError).message` 与页面内硬编码 message 分支
- 当前整轮代码质量重构只剩 HTTP client 的猜测性 API base URL fallback 需要清理

### 下一步建议

1. 进入最后阶段，移除 `apps/web/src/lib/http/client.ts` 中面向未知 host 的猜测性 fallback
2. 完成最终一轮验证、进度更新与整体收尾提交

### 注意事项

- 本轮没有新增 ADR，因为实现仍落在 `docs/adr/0009-code-quality-refactor-boundaries.md` 已确认的“错误边界收口”范围内
- 后端当前仍主要返回 slug 型 message；本轮只是前端统一读取方式，没有擅自变更后端协议

## 2026-04-21

### 已完成

- 已完成代码质量重构第三阶段的后台工作区拆分：
  - `resources-workspace.tsx` 已收口为 query / mutation / 页面级确认与状态联动，资源列表、详情、批量目标和右侧操作表单已下沉到 `workspaces/resources/`
  - `rules-workspace.tsx` 已收口为 query / mutation / 编辑状态编排，规则列表、编辑与绑定、概览说明已下沉到 `workspaces/rules/`
  - 两个后台工作区主文件都不再直接堆放格式化 helper 和大段 JSX
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/code-quality-third-phase-admin-workspace-split.md`

### 当前状态

- 代码质量基线文档中“拆学生端预约页 + 拆后台资源/规则工作区”的职责拆分项已经全部落地
- 当前剩余的主要收口事项只剩前端错误契约统一与 HTTP fallback 清理

### 下一步建议

1. 进入下一阶段，统一 `ApiError` 的稳定读取入口，减少页面直接依赖字符串 message
2. 在错误契约收口后，清理 `http/client.ts` 中的猜测性 API base URL fallback，并完成最终验证

### 注意事项

- 本轮没有新增 ADR，因为拆分边界仍完全落在 `docs/adr/0009-code-quality-refactor-boundaries.md` 已确认范围内
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已完成代码质量重构第二阶段的学生端页面拆分：
  - `spaces-page.tsx` 已收口为查询、状态与提交编排，时间轴 segment / 冲突判断 / 可用性面板 / 提交面板已下沉到 `ui/pages/spaces/`
  - `sports-page.tsx` 已收口为查询、目标切换与提交编排，slot state 推导 / 时间表面板 / 提交面板已下沉到 `ui/pages/sports/`
  - 两个主页面已不再直接堆放大段派生逻辑和展示细节
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/code-quality-second-phase-student-page-split.md`

### 当前状态

- 代码质量基线文档中“先拆学生端 `spaces-page.tsx` 与 `sports-page.tsx`”已完成
- 当前学生端两个预约页的主文件职责已经明显收窄，后续可以继续按相同原则处理后台 `resources-workspace.tsx` 与 `rules-workspace.tsx`

### 下一步建议

1. 进入下一阶段，拆分管理员 `resources-workspace.tsx` 与 `rules-workspace.tsx` 中混杂的派生逻辑和大块视图
2. 在 admin 工作区拆分完成后，再统一收口错误契约和 HTTP fallback

### 注意事项

- 本轮没有新增 ADR，因为拆分边界完全落在 `docs/adr/0009-code-quality-refactor-boundaries.md` 已确认范围内
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已根据第二轮用户测试 `docs/user_test/web_problem_2.md` 重新核对线上与当前代码状态，并确认 2 条新的真实问题：
  - `UTG-011`：学术空间“创新协作室”在线上 API 中没有任何资源单元，导致学生端时间轴看起来像“未加载”
  - `UTG-012`：管理端预约关闭规则只有新增和更新能力，没有删除或撤销入口
- 已新增第二轮确认问题文档：
  - `docs/plans/user-test-gap-round2-confirmed-issues-2026-04-21.md`
- 已更新结构化开发列表：
  - `docs/plans/feature-list.json` 已追加 `UTG-011`、`UTG-012`
- 已为首轮闭环文档补充说明，避免继续误导为“当前所有用户测试问题都已闭环”：
  - `docs/plans/user-test-gap-closure-plan-2026-04-21.md`

### 当前状态

- 当前首轮用户测试问题仍然视为已闭环，但第二轮用户测试已经重新打开 2 条新的高优先级问题
- 其中 `UTG-011` 不是单纯前端渲染 bug，而是“线上资源数据不完整 + 学生端缺少零单元空状态”的叠加问题

### 下一步建议

1. 先处理 `UTG-011`，确保学生端 `spaces` 页面不再把零单元资源渲染成近似空白状态
2. 再处理 `UTG-012`，补齐后台关闭规则的对称撤销能力

### 注意事项

- 本轮只固化第二轮已确认问题，没有修改业务代码
- `web_problem_2.md` 中其余问题当前仍需补充现场现象或复测证据后，才能继续纳入正式开发列表

## 2026-04-21

### 已完成

- 已完成代码质量重构第一阶段的共享小逻辑收口：
  - 新增预约输入 helper，`parseCompanionEmails` 不再在学术页和体育页各写一份
  - 新增工单状态 helper，学生端、后台工单工作区和后台总览现在共用同一套状态 label / tone / option 来源
  - 首页服务卡片已改为稳定 key 与显式中英文文案，不再通过中文标题值分支推导英文
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/code-quality-first-phase-shared-helpers.md`

### 当前状态

- 代码质量基线文档中第一批“共享小逻辑收口”事项已开始落地
- 当前已消除预约邮箱解析、工单状态字典和首页服务卡片文案映射这三类明确重复

### 下一步建议

1. 继续按基线顺序推进第二阶段，优先拆学生端 `spaces-page.tsx` 与 `sports-page.tsx` 的页面内派生逻辑
2. 再处理管理员 `resources-workspace.tsx` 与 `rules-workspace.tsx` 的职责拆分

### 注意事项

- 本轮没有新增 ADR，因为实现范围完全落在 `docs/adr/0009-code-quality-refactor-boundaries.md` 已确认的边界内
- `no_show` 的“已结束 / 已爽约”语义漂移尚未处理，刻意留给后续单独决策，不与这批机械性收口混做

## 2026-04-21

### 已完成

- 已将本轮代码质量 review findings 固化为正式文档，作为后续重构基线：
  - `docs/architecture/code-quality-review-and-refactor-baseline-2026-04-21.md`
  - 已详细记录当前主要问题、影响、重构原则与第一批拆分顺序
- 已新增 ADR：
  - `docs/adr/0009-code-quality-refactor-boundaries.md`
  - 明确后续重构必须优先按职责拆分，而不是继续引入过早抽象或猜测性兜底
- 已更新架构文档导航：
  - `docs/architecture/README.md`

### 当前状态

- 当前仓库已经有一份可直接作为下一轮重构输入的正式基线文档
- 后续若继续实施重构，应以本轮固化的问题边界为准，不再回到“大页面里继续堆逻辑”的路径

### 下一步建议

1. 先从共享小逻辑收口开始，优先消除 `parseCompanionEmails`、工单状态字典和首页服务卡片文案映射的重复
2. 再按文档顺序拆学生端预约页与管理员资源/规则工作区
3. 最后再收口错误契约，避免边改页面边继续扩散字符串协议

### 注意事项

- 本轮只新增/更新文档，没有修改业务代码或接口语义

## 2026-04-21

### 已完成

- 已修复资源工作区“新增资源单元”报错 `property resourceId should not exist`：
  - 前端创建资源单元时，`resourceId` 现在只用于 URL 路径参数，不再混入请求体
  - 后端 `CreateResourceUnitDto` 的严格白名单校验已可正常通过
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/resource-unit-create-body-fix.md`

### 当前状态

- 资源工作区“新增资源单元”路径已恢复可用
- 本轮属于前端请求体修复，不涉及后端 DTO、接口协议或新的产品决策

### 下一步建议

1. 若继续推进管理端能力补齐，可按前一轮建议进入“体育组合场地后台可维护”任务
2. 若用户现场还遇到其他写操作报错，优先继续按“前端请求体 vs 后端 DTO”方式快速核对

### 注意事项

- 本轮没有新增 ADR，因为修复不涉及边界或产品决策变化
- 当前工作区仍保留未跟踪的 `docs/user_test/`，本轮未触碰

## 2026-04-21

### 已完成

- 已完成 `UTG-005`：
  - 体育页仅在当前资源存在组合数据时显示“组合预订”入口，不再暴露无意义切换
  - 组合目标不再只显示“几个单元”，而是直接展示成员场地摘要
  - 组合预订模式已补成员场地、用途描述和“整组锁定 / 任一成员冲突则不可选”的效果说明
  - 提交区已明确提示本次会同时预约整组场地，避免被误解成单场地预约
- 已沉淀一条新的学生端产品表达决策：
  - 新增 ADR：`docs/adr/0014-grouped-sports-booking-kept-as-explained-secondary-mode.md`
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-005-grouped-booking-clarity.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-005` 当前可标记为通过
- 用户测试闭环中，`UTG-001` 至 `UTG-010` 当前已全部完成
- 当前没有剩余的明确用户测试缺口需要继续推进

### 下一步建议

1. 若要继续增强最终汇报说服力，可补一组浏览器级截图或录屏，覆盖“单场地”和“组合预订”两条路径
2. 若后续继续做产品化收尾，可转向 `PUX-005` 一类最终演示证据整理

### 注意事项

- 本轮没有修改后端组合预约模型、接口或 demo seed，只收口了前端表达与入口可见性
- 当前组合模式仍依赖资源已有组合数据；若后续希望后台可维护该能力，需要单独规划资源组合管理入口

## 2026-04-21

### 已完成

- 已完成 `UTG-010`：
  - 后端放号规则能力继续保留，但前端资源工作区默认主路径不再与关闭规则并列暴露
  - 资源工作区新增“高级调度设置”，只有资源已存在开放策略或管理员主动展开时，才显示相关配置表单
  - 资源状态、概况卡片和学生端提示文案已统一从“放号 / 待放号”收口为“开放策略 / 待开放”
  - 保存开放策略后会同时刷新资源列表与资源状态，避免状态展示滞后
- 已沉淀一条新的管理端展示决策：
  - 新增 ADR：`docs/adr/0013-demo-release-rules-demoted-to-advanced-scheduling.md`
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-010-release-strategy-positioning.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-010` 当前可标记为通过
- 用户测试闭环中，已完成的明确缺口包括 `UTG-001`、`UTG-002`、`UTG-003`、`UTG-004`、`UTG-006`、`UTG-007`、`UTG-008`、`UTG-009`、`UTG-010`
- 当前剩余更值得继续推进的用户测试项只剩 `UTG-005`

### 下一步建议

1. 先为 `UTG-005` 形成明确产品结论，决定组合场地入口是保留、简化还是隐藏
2. 若后续继续打磨管理员演示体验，可补一组资源工作区“默认路径 vs 高级调度设置”的浏览器级截图证据

### 注意事项

- 本轮没有删除后端放号规则模型或接口，只调整了前端默认暴露方式和文案表达
- 当前 demo seed 仍未主动使用放号规则；若后续引入真实延迟开放场景，应继续沿用这次“默认收起、已有策略显式展示”的呈现原则


## 2026-04-21

### 已完成

- 已完成 `UTG-009`：
  - 活动创建表单已拆成“基础信息 + 默认首票 + 进阶设置”
  - 管理员可只填写标题、地点、总额度，系统默认生成一张免费单票，库存跟随总额度
  - 描述、售卖时间、活动时间和状态已收进折叠区，不再强迫首屏同时填写
  - 现有“活动加票与状态切换”路径保持不变，不影响后续运营动作
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-009-activity-create-form-simplification.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-009` 当前可标记为通过
- 用户测试闭环中，已完成的明确缺口包括 `UTG-001`、`UTG-002`、`UTG-003`、`UTG-004`、`UTG-006`、`UTG-007`、`UTG-008`、`UTG-009`
- 当前剩余更值得继续推进的用户测试项为 `UTG-005`、`UTG-010`

### 下一步建议

1. 先为 `UTG-005` 形成明确产品结论，决定组合场地入口是保留、简化还是隐藏
2. 再处理 `UTG-010`，复审放号规则在当前演示产品中的暴露方式
3. 若后续继续做体验收口，可补一组管理员创建活动的浏览器级截图证据

### 注意事项

- 本轮没有修改活动后端接口，只是重组前端创建路径
- 默认创建状态已改为 `draft`，避免进阶设置折叠后意外直接发布

## 2026-04-21

### 已完成

- 已完成 `UTG-008`：
  - 登录页密码输入框右侧已新增显隐切换按钮
  - 默认继续保持隐藏，点击后可在显示 / 隐藏之间切换
  - 切换按钮已补中英文文案、`aria-label` 与 `aria-pressed`
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-008-login-password-visibility-toggle.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-008` 当前可标记为通过
- 用户测试闭环中，已完成的明确缺口包括 `UTG-001`、`UTG-002`、`UTG-003`、`UTG-004`、`UTG-006`、`UTG-007`、`UTG-008`
- 当时剩余更值得继续推进的用户测试项为 `UTG-005`、`UTG-009`、`UTG-010`

### 下一步建议

1. 先为 `UTG-005` 形成明确产品结论，决定组合场地入口是保留、简化还是隐藏
2. 再处理 `UTG-009`，简化管理员新增活动时的默认表单路径
3. 最后处理 `UTG-010`，复审放号规则的前台暴露方式

### 注意事项

- 本轮只改登录页前端交互，不涉及登录接口、鉴权流程或运行时配置
- 该项属于局部交互补丁，不需要单独新增 ADR

## 2026-04-21

### 已完成

- 已完成 `UTG-006`：
  - 登录页品牌标题已接入双语切换，英文模式不再固定显示中文副标题
  - 资源、通知、规则、活动工作区的创建表单已清掉中文预填示例，改为依赖本地化 placeholder 或空白输入
  - 资源工作区剩余的硬编码标题、placeholder、成功提示和提交按钮文案已接入双语
  - 共享日期工具已改为默认跟随当前 `locale`，英文模式下不再继续输出中文日期格式和“未设置”
- 已沉淀一条新的前端多语言实现决策：
  - 新增 ADR：`docs/adr/0012-locale-aware-frontend-date-formatting.md`
- 已完成本地校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-006-english-locale-cleanup.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-006` 当前可标记为通过
- 用户测试闭环中，已完成的明确缺口包括 `UTG-001`、`UTG-002`、`UTG-003`、`UTG-004`、`UTG-006`、`UTG-007`
- 当时剩余更值得继续推进的用户测试项为 `UTG-005`、`UTG-008`、`UTG-009`、`UTG-010`

### 下一步建议

1. 先为 `UTG-005` 形成明确产品结论，决定组合场地入口是保留、简化还是隐藏
2. 继续处理 `UTG-008`，为登录页补显示密码开关
3. 再视展示优先级处理 `UTG-009` 与 `UTG-010`

### 注意事项

- 本轮刻意不清理用户输入内容、通知正文或其他业务数据正文的原始语言
- 若后续有导出或固定格式展示需求，应对日期工具显式传入 `locale`，而不是依赖默认当前语言

## 2026-04-21

### 已完成

- 已完成 `UTG-004`：
  - 学术空间页已接入公共预约状态查询，不再只展示资源单元后直接提交预约
  - 页面已新增“资源单元 × 连续时间轴”的可用性视图，可展示占用、关闭、进行中和当前选择区间
  - 开始时间 / 结束时间表单已与时间轴联动，可在提交前识别明显冲突或关闭区间
- 已沉淀一条新的前端表达决策：
  - 新增 ADR：`docs/adr/0011-academic-space-availability-uses-continuous-timeline.md`
  - 学术空间后续采用连续时间轴，而不是照搬体育页的离散槽位表
- 已完成本地校验与运行时验证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web`
  - 本地前端 bundle 已更新为 `assets/index-CKB0JMC-.js`
  - 新增验证记录：`docs/verification/2026-04-21/utg-004-academic-space-availability-visualization.md`

### 当前状态

- 学术空间页已从“纯表单预约”升级为“可视化可用性 + 表单联动”模式
- 当时识别出的下一项明确缺口是 `UTG-006`，现已在后续轮次完成

### 下一步建议

1. 若后续想进一步提升学术空间体验，可补“快捷对齐到最近可用边界”或推荐时长
2. 继续围绕剩余用户测试项推进 `UTG-005`、`UTG-008`、`UTG-009`、`UTG-010`

### 注意事项

- 本轮没有新增后端 schema 或接口，只是在现有公共预约状态接口之上补齐前端可视化
- 学术空间当前采用连续时间轴视图，这一表达方式已在 ADR 中固化，不应再退回离散槽位表

## 2026-04-21

### 已完成

- 已完成 `REG-001` 本地真实复测：
  - 使用本地 HTTPS 站点管理员链路创建临时资源与资源单元成功
  - 创建响应中已包含新增资源单元，说明“新增后结构刷新数据”链路成立
  - 重复资源单元编码返回 `409 resource-unit-code-conflict`
  - 已使用最新删除接口清理临时测试资源与资源单元
- 已完成 `REG-002` 审计与补齐：
  - 复测时确认活动状态切换缺少统一反馈面板
  - 复测时确认管理员取消预约、资源停用、规则停用、活动关闭、工单关闭缺少确认提示
  - 上述缺口本轮已补齐，并重新构建本地 `web`
- 已更新用户测试闭环状态：
  - `UTG-007` 现可标记为通过
  - `REG-001` 不再视为真实缺陷，只保留为已验证通过事项
- 已完成验证与本地运行时更新：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps api web`
  - `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web`
  - 本地前端 bundle 已更新为 `assets/index-DEaL4bkf.js`
  - 新增验证记录：`docs/verification/2026-04-21/reg-001-reg-002-runtime-retest.md`

### 当前状态

- `REG-001`、`REG-002` 均已形成明确结论，不需要继续以“笼统问题”形式保留
- `docs/plans/feature-list.json` 中的 `UTG-001`、`UTG-002`、`UTG-003`、`UTG-007` 当前均可标记为通过
- 用户测试闭环中，下一组更适合继续推进的明确缺口为 `UTG-004` 与 `UTG-006`

### 下一步建议

1. 优先处理 `UTG-004`，为学术空间补齐可视化可用时间视图
2. 之后处理 `UTG-006`，做一次英文模式系统化清理
3. 若要继续增强验收证据，可补一组浏览器级录屏或截图，覆盖资源单元新增和活动状态切换反馈

### 注意事项

- `REG-002` 不是“完全没有提示”，而是“存在局部缺口”；这批缺口本轮已补齐
- 本轮没有新增后端 schema 变更，主要是运行时复测、前端反馈补齐和本地容器更新

## 2026-04-21

### 已完成

- 已完成 `UTG-002` 与 `UTG-003`：
  - 资源工作区已支持资源启用 / 停用、资源安全删除、资源单元安全删除
  - 对仍有关联配置或历史记录的资源 / 资源单元，删除会被阻止并返回明确原因
  - 规则工作区已从快照页升级为可配置工作区，支持创建、编辑、启停、绑定、解绑和删除规则
- 已同步补齐与本轮相关的写操作反馈：
  - 规则与资源工作区中的危险操作已增加确认提示
  - 规则与资源工作区中的新增、启停、绑定、解绑、删除已具备进行中 / 成功 / 失败反馈
- 已将本轮策略沉淀为 ADR：
  - 新增 `docs/adr/0010-admin-safe-deactivate-and-delete-policy.md`
- 已完成本地验证并留证：
  - `pnpm --filter api lint`
  - `pnpm --filter api typecheck`
  - `pnpm --filter api build`
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-002-utg-003-admin-ops-and-rules-workspace.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-001`、`UTG-002`、`UTG-003` 当前均可标记为通过
- 管理端已不再停留在“资源可看不可删、规则可看不可配”的状态
- `UTG-007` 已在资源与规则工作区部分收口，但仍未完成全工作区审计

### 下一步建议

1. 先执行 `REG-001` 与 `REG-002`，验证“新增资源单元”与“操作提示覆盖率”在真实运行时下的结论
2. 继续处理 `UTG-004` 与 `UTG-006`，分别补齐学术空间可视化可用时间和英文模式残留
3. 若后续确认资源单元确有“保留历史但停用”的运营需求，再评估是否为 `ResourceUnit` 增加状态字段

### 注意事项

- 本轮刻意没有为 `ResourceUnit` 新增状态字段，而是采用“无引用时安全删除”的最小实现
- `UTG-007` 目前只对资源与规则工作区形成较完整反馈基线，其他工作区仍需继续审计

## 2026-04-21

### 已完成

- 已完成 `UTG-001`：
  - 修正体育预约离散时段在订单详情中的错误连续展示
  - “我的订单”列表卡片已补充真实预约时间展示，不再只显示下单时间
  - 组合场地模式下重复的同一时间槽位会先去重，再按连续段归并展示
- 已顺手收紧同源状态判断问题：
  - 体育离散预约在两个时段之间的空档不再误显示为“进行中”
- 已完成本地前端校验并留证：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - 新增验证记录：`docs/verification/2026-04-21/utg-001-sports-order-slot-display.md`

### 当前状态

- `docs/plans/feature-list.json` 中的 `UTG-001` 当前已可标记为通过
- 用户测试闭环中的最高优先级剩余项收敛为 `UTG-002`、`UTG-003`

### 下一步建议

1. 继续推进 `UTG-002` 与 `UTG-003`，统一规划资源 / 资源单元 / 规则的停用、解绑和安全删除边界
2. 在进入这轮后台能力改造前，先补做 `REG-001` 与 `REG-002` 的真实复测，避免继续基于笼统反馈开发

### 注意事项

- 本轮主要修改前端展示层，没有改动体育预约提交接口和冲突判断逻辑
- 本轮额外修正了体育离散时段的进度状态判断，这是由同一“连续区间假设”引出的关联问题

## 2026-04-21

### 已完成

- 已基于 `docs/user_test/web_problem.md` 与当前代码真实状态，固化一份用户测试问题闭环计划：
  - 新增 `docs/plans/user-test-gap-closure-plan-2026-04-21.md`
  - `docs/plans/feature-list.json` 已追加 `UTG-001` 至 `UTG-010`
- 已把用户测试问题拆成三类，避免后续排期失真：
  - 真实未解决缺口
  - 需要产品决策的事项
  - 代码已接通但需要回归复测的事项
- 已确认当前高优先级缺口集中在三条主线：
  - 体育离散时段显示错误
  - 管理端资源 / 规则缺少删除或归档能力
  - 规则工作区仍停留在快照展示，缺少真实配置入口

### 当前状态

- 用户测试反馈已不再只是单页问题清单，而是升级为仓库内可跟踪、可排期、可验收的 `UTG-*` 任务集合
- 后续如需继续收口，可直接按 `UTG-*` 编号推进，不必重新从聊天记录恢复上下文

### 下一步建议

1. 优先处理 `UTG-001`、`UTG-002`、`UTG-003`
2. 在下一轮实现前先执行 `REG-001` 与 `REG-002`，补齐“新增资源单元”和“操作提示覆盖率”的真实运行时结论

### 注意事项

- 本轮只固化任务、计划和进度记录，没有修改业务代码
- “无法新增资源单元”和“所有操作都没有提示”不应继续笼统表述，需要按“复测项”和“部分补齐待审计”分别处理

## 2026-04-21

### 已完成

- 已修复正式站点登录页 `request failed 405` 问题：
  - 根因是前端把空字符串 `apiBaseUrl` / `VITE_API_BASE_URL` 误当成有效配置
  - 登录请求因此被发到当前站点相对路径 `/auth/login`，而不是 `api.campusbook.top`
  - 当前已将空字符串统一视为“未配置”，恢复自动回退到正式 API 域名
- 已完成前端校验与上线：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web`
- 已新增验证记录：
  - `docs/verification/2026-04-21/web-login-405-api-base-url-fallback.md`

### 当前状态

- 正式站点 `https://campusbook.top/login` 当前已切换到包含修复的新前端 bundle
- 即使运行时 `config.js` 中的 `apiBaseUrl` 为空字符串，前端也不会再退化为请求当前站点自身

### 下一步建议

1. 若后续继续演进运行时配置，统一保持“空字符串等于未配置”的语义，避免再次短路默认回退

### 注意事项

- 这次问题说明：只检查“配置字段是否存在”不够，前端运行时配置还必须区分“存在但为空”和“有效值”

## 2026-04-21

### 已完成

- 已把“前端 demo 凭据与后端运行时值错位”的问题沉淀为长期规则：
  - 新增 ADR：`docs/adr/0009-runtime-config-for-frontend-demo-credentials.md`
  - 发布基线已补充运行时配置类改动的强制验证项
- 已明确后续防回归原则：
  - 这类前后端必须同源的前端可见值，不能只写在前端源码常量里
  - 生产 compose 发布必须显式使用 `--env-file .env`
  - 涉及 demo 登录或运行时前端配置时，发布后必须核验 `/config.js` 与实际登录结果

### 当前状态

- 本次 bug 已从临时排查结果升级为仓库内的长期约束，后续可以直接按 ADR 和部署基线执行

### 下一步建议

1. 若后续继续减少人为失误，可补一个统一生产发布脚本，把 `--env-file .env` 和关键验证收进脚本

### 注意事项

- 这次问题不是单纯前端页面 bug，而是“前端源码常量 + compose 默认 env + 运行时注入”三者错位造成的部署级问题

## 2026-04-21

### 已完成

- 已修复网页端 demo 快捷填充密码与真实 demo 账号不一致的问题：
  - 前端不再只依赖 `apps/web/src/ui/demo-accounts.ts` 中的源码常量
  - 新增运行时配置读取模块，由 `web` 容器把 demo 凭据写入 `/config.js`
  - `infra/docker-compose.yml` 已为 `web` 注入 demo 账号环境变量
- 已完成线上核验与重建：
  - 使用 `--env-file .env` 重建 `web`
  - 确认线上 `config.js` 中的 demo 凭据已与根 `.env` 一致
  - 确认学生/管理员 demo 账号登录 API 返回 `200`
  - 确认旧默认学生密码 `demo123456` 返回 `401`
- 已新增验证记录：
  - `docs/verification/2026-04-21/web-demo-credentials-runtime-sync.md`

### 当前状态

- 真实网站当前应已可正确使用学生/管理员 demo 快捷带入
- demo 密码后续可通过运行时环境变量轮换，不再要求改动前端源码

### 下一步建议

1. 若后续变更 demo 凭据，只更新根 `.env` 后按基线重建 `web`
2. 若需要更强验收证据，可再补一组浏览器级录屏或截图

### 注意事项

- 生产环境重建 `web` 时必须显式带 `--env-file .env`；否则 `config.js` 会写入 compose 默认 demo 凭据，导致前后端密码再次错位

## 2026-04-21

### 已完成

- 已将“改动后按受影响服务做增量发布，而不是重启整机”的部署理解写入长期标准
- `docs/standards/deployment-baseline.md` 当前已补充：
  - 前端改动重建 `web`
  - 后端改动重建 `api / worker`
  - migration 先于后端发布执行
  - Nginx / HTTPS 改动单独更新 `nginx`
  - 发布后最小验证要求
- 已确认当前线上服务落后于仓库最新业务代码：
  - 仓库已包含通知模块与首页通知区
  - 线上 `https://api.campusbook.top/notifications` 仍返回 `404`
  - 本轮因此需要增量更新 `web + api + worker`
- 已完成本轮增量发布：
  - 先执行 `prisma:migrate:deploy`
  - 重建 `api`
  - 重建 `web`
  - 替换 `api / worker / web`
- 已新增验证记录：
  - `docs/verification/2026-04-21/ops-incremental-service-sync.md`
- 已确认同步后：
  - `https://api.campusbook.top/notifications` 返回 `200`
  - 线上前端 bundle 已切换到新哈希 `index-CfShXjUs.js`

### 当前状态

- 当前增量发布规则已经被文档化，可作为后续每次功能上线的统一执行基线
- 线上 `web / api / worker` 当前已同步到仓库最新业务代码

### 下一步建议

1. 后续若再有业务改动，直接按本轮写入的增量发布规则执行
2. 如果需要减少人为步骤，可继续补一个正式环境的一键增量发布脚本

### 注意事项

- 线上当前不是“未启动”，而是“已同步到当前仓库业务代码”
- 对 Docker 生产环境来说，普通 restart 不会替换成新代码镜像

## 2026-04-21

### 已完成

- 已将用户新增的长期代码评估与实现要求写入 `AGENTS.md`：
  - 后续代码评估默认围绕模块化/组件化、高内聚低耦合、单一职责与清晰组织、简洁高效和可读性展开
  - 明确反对过度设计、兜底代码、冗余代码与猜测性代码
  - 明确遇到不理解的业务边界时应先提问或声明假设，而不是擅自补全

### 当前状态

- 该约束已沉淀为仓库级协作规则，后续 review 与实现都应以此为准

### 下一步建议

1. 后续若要继续细化，可将其中与工程实现强相关的部分再同步提炼到 `docs/standards/engineering-rules.md`

### 注意事项

- 本轮仅更新协作规则与进度记录，没有修改业务代码

## 2026-04-21

### 已完成

- 已完成 `APP-017` 剩余收口：
  - `Notification` 模型已新增可选 `imageUrl` 字段，并完成 Prisma migration
  - shared types、DTO、service、demo seed 与前端 API 已接通简单图片 + 文字通知链路
  - 管理员通知工作区已支持图片链接输入与预览
  - 学生首页与公共首页的通知区已支持图片展示，并收敛为复用组件
- 本轮校验与运行时收口已通过：
  - `pnpm prisma:generate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - 本地 `prisma migrate deploy`
  - 本地 `seed:demo`

### 当前状态

- `PUX-010`、`APP-017`、`APP-018` 现已全部满足当前验收口径

### 下一步建议

1. 若后续继续演进通知能力，可优先增加站内跳转链接与发布时间窗口，不必直接扩成富文本 CMS
2. 若要补交更强证据，可补一组浏览器级截图，覆盖“管理员发布带图通知 -> 学生首页可见”

### 注意事项

- 本轮首次并行触发 `seed:demo` 时，由于 migration 尚未完成出现一次时序失败；随后已按顺序重跑并成功
- 当前通知图片能力采用简单 `imageUrl` 字段，仍保持模块解耦，没有引入上传系统或富文本耦合

## 2026-04-21

### 已完成

- 已完成 `PUX-010` 剩余收口：
  - “我的订单”页已合并正常订单、已结束订单与已取消历史
  - 已取消订单会在订单列表内直接展示取消时间与取消原因
  - 独立“取消记录”页面、路由与导航入口已删除
- 本轮前端校验已通过：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`

### 当前状态

- `PUX-010` 现已达到最新验收口径
- 当前待完成项只剩 `APP-017` 的简单图片 + 文字通知闭环

### 下一步建议

1. 继续为通知模型补可选图片字段，并贯通管理端编辑与学生首页展示

### 注意事项

- 本轮只修改学生订单前端聚合展示、导航与路由，没有改动后端订单接口

## 2026-04-21

### 已完成

- 已按后续静态 code review 纠正任务完成状态：
  - `PUX-010` 当前只完成学生端双语覆盖与管理员冗余导航收口，取消记录并单尚未落地
  - `APP-017` 当前只完成纯文本通知链路，简单图片字段、管理端输入和学生端展示尚未落地
  - `APP-018` 学生提报修工单与管理员接收处理链路已核实打通，可视为通过
- 已修正文档：
  - `docs/plans/feature-list.json`
  - `docs/verification/2026-04-21/pux-010-app-017-app-018-closeout.md`

### 当前状态

- 当前真正仍未完成的核心缺口只剩两项：
  - `PUX-010` 的取消记录并入“我的订单”
  - `APP-017` 的简单图片 + 文字通知闭环

### 下一步建议

1. 先删除独立取消记录页、路由和导航，把已取消订单合并回 `OrdersPage`
2. 再为通知补 `imageUrl` 或等价简单图片字段，串通 Prisma / shared-types / API / 管理端表单 / 学生端展示

### 注意事项

- 本轮为静态代码复核与文档纠偏，没有修改业务代码、接口语义或数据库 schema
- 本条记录用于覆盖同日稍早的乐观判断；后续验收应以本条状态为准

## 2026-04-21

### 已完成

- 已修正“主页面 demo 快捷登录”落点错误：
  - 匿名访问 `/` 时不再立即重定向到登录页，而是展示公共首页
  - 公共首页新增“学生入口 / 教师入口”快捷登录卡片
  - 点击入口后会带着身份参数进入登录页，登录页再自动填充对应 demo 账号密码
- 本轮前端校验已通过：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`

### 当前状态

- 网页端现在具备真正的“主页面快捷登录 demo”入口，而不只是登录页内部的次级快捷带入

### 下一步建议

1. 若后续继续做浏览器级验证，应优先确认匿名访问首页时能直接看到两类入口卡片
2. 若后续还要调整登录入口文案，保留 `role` 查询参数驱动的自动填充能力，避免首页和登录页再次脱节

### 注意事项

- 本轮改动只涉及前端首页与登录页，不影响鉴权接口和 demo 账号数据

## 2026-04-21

### 已完成

- 已按最新产品表述修正任务清单：
  - `PUX-010` 已明确为“我的订单内合并取消记录视图”，不再表述为独立取消记录页
  - `APP-017` 已明确为“支持简单图片 + 文字内容的首页通知与管理员发布闭环”

### 当前状态

- 当前只调整 feature list 的需求措辞，使之更贴近最新产品要求

### 下一步建议

1. 后续若继续改实现，应以本次修正后的 wording 为准，不再按“独立取消记录页”推进
2. 通知模型后续若落地图片能力，优先保持“简单图片 + 文字”边界，不要直接扩成富文本 CMS

### 注意事项

- 本轮未修改业务代码，只修正文档中的需求描述

## 2026-04-21

### 已完成

- 已将登录页 demo 账号快捷带入从次级说明提升为主入口操作：
  - 登录表单上方新增“学生入口 / 教师入口”双按钮
  - 点击后会直接带入学生 demo 或管理员 demo 账号密码
  - 底部演示说明改为引用主入口，不再重复放置次级按钮
- 本轮前端校验已通过：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- 登录页主区域已经保留清晰可见的 demo 账号快捷带入能力，后续改版时不容易被误删或埋没

### 下一步建议

1. 若后续继续调整首页或登录页视觉层级，应保留当前“身份入口直接带入账号”的交互，不要退回到底部说明文案

### 注意事项

- 本轮只调整登录页入口层级与进度记录，没有改动鉴权接口或账号数据

## 2026-04-21

### 已完成

- 已根据 review findings 完成管理员工作台 follow-up 收口：
  - `OverviewWorkspace` 改为真正随语言切换同步更新主体文案
  - `ActivitiesWorkspace` 与 `RulesWorkspace` 不再忽略 `locale`，主体内容、状态标签和操作文案已接入双语
  - 管理员总览页已补通知与工单的统计、快捷入口、默认首页快照与“今日入口”展示，不再只覆盖资源/活动/规则
- 本轮前端校验已通过：
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- 管理员默认首页与内部工作区已经与新增的通知/工单能力边界保持一致
- 管理员英文页不再只切壳层，`overview / activities / rules` 三个工作区的主体内容也会跟随语言切换

### 下一步建议

1. 若要继续补强产品完成度，可补一组管理员端中英文切换的浏览器级截图证据
2. 后续新增后台工作区时，优先从 `admin-helpers` 和当前 workspace 模板复用双语标签，避免再次出现“壳层双语、主体单语”的回归

### 注意事项

- 本轮只修改管理员前端工作区与进度记录，没有改动后端接口语义

## 2026-04-21

### 已完成

- 注：本条目中的 `PUX-010` 与 `APP-017` 完成判断已被同日后续 code review 纠偏，不再视为完成；`APP-018` 保持通过
- 已完成 `PUX-006` 剩余收口：
  - 登录页补学生 demo / 管理员 demo 账号快捷带入
  - 学生首页补真实通知区，展示 demo 通知样例
  - 管理员工作台补通知编辑与发布入口
- 已完成 `PUX-010`：
  - 学生端核心页面补齐双语切换覆盖
  - “我的订单”不再重复展示已取消历史
  - 管理员工作台删除独立“工作区导航”说明块，切换入口收拢为单一紧凑条
- 已完成 `APP-017`：
  - 新增 `Notification` Prisma 模型、migration、API 模块与前端 API
  - 学生首页与管理员工作台共用同一条通知数据链路
  - demo seed 已写入 2 条已发布通知与 1 条草稿通知
- 已完成 `APP-018`：
  - 新增 `ServiceRequest` Prisma 模型、migration、API 模块与前端页面
  - 学生端可提交报修工单并查看自己的记录
  - 管理员工作台可查看并更新工单状态与备注
- 已补正式决策记录：
  - `docs/adr/0008-notification-and-service-request-workspaces.md`
- 已补本轮验证记录：
  - `docs/verification/2026-04-21/pux-010-app-017-app-018-closeout.md`
- 已完成本轮校验与本地数据收口：
  - `pnpm prisma:generate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test`
  - 本地 `prisma migrate deploy`
  - 本地 `seed:demo`
- 已修复本轮运行时发现的唯一兼容性问题：
  - `apps/api/src/scripts/seed-demo-data.ts`
  - 旧 seed 假设 demo 用户主键固定，遇到已有数据库会触发通知外键失败；现已改为复用 upsert 后返回的真实用户 ID

### 当前状态

- `PUX-006`、`PUX-010`、`APP-017`、`APP-018` 已完成并可在当前代码中找到完整入口
- 本地数据库 migration 已应用，demo 通知与 demo 工单样例已成功写入
- 当前通过结论基于静态校验、构建和本地 migration/seed 成功

### 下一步建议

1. 若要补强答辩或交付证据，应新增至少一组浏览器级验证：
   - 学生首页看到管理员刚发布的通知
   - 学生提报修工单后，管理员工作台立即可见并能更新状态
2. 若后续继续演进通知能力，可考虑增加置顶、跳转链接和发布时间窗口
3. 若后续继续演进工单能力，可考虑增加工单分类、处理人、附件和 SLA

### 注意事项

- 本轮对本地数据库执行了新增 migration 和 demo seed
- `docs/architecture/architecture-diagrams.md` 与 `docs/architecture/current-implementation-audit-2026-04-21.md` 当前存在会话外改动，本轮未改动这些文件

## 2026-04-21

### 已完成

- 已新增中文报告初稿：
  - `docs/architecture/architecture-and-product-report-2026-04-21.md`
- 报告内容已按当前代码真实状态撰写，覆盖：
  - 产品目标与使用流程
  - 多态空间数据库 Schema 设计
  - 高并发防超卖策略
  - 统一订单状态机与缺席处理
  - 无障碍与性能优化实践
- 报告写法已显式区分：
  - 当前真实已实现能力
  - 仍属基础设施预留或后续优化的能力
- 已更新文档导航：
  - `docs/architecture/README.md`

### 当前状态

- 当前仓库已经具备：
  - 代码事实版图表
  - 实现审计文档
  - 一版可直接继续润色的中文架构与产品使用报告初稿

### 下一步建议

1. 若要用于正式提交，可继续补一版：
   - 更偏答辩口吻的压缩版
   - 更偏书面材料的正式版
2. 若后续要交英文版，可直接以本轮中文稿为母稿翻译并按术语统一

### 注意事项

- 本轮新增的是报告文档，没有修改业务代码

## 2026-04-21

### 已完成

- 已基于当前代码完成一轮“真实实现状态审计”，不是继续沿用推荐方案或题面推断
- 已重写架构图文档：
  - `docs/architecture/architecture-diagrams.md`
  - 当前内容已切换为按代码核实后的真实拓扑、业务流程、并发处理、异步任务与状态机图
- 已新增实现审计文档：
  - `docs/architecture/current-implementation-audit-2026-04-21.md`
- 已在审计中明确当前关键事实：
  - 学术预约、体育预约、活动报名当前都直接创建为 `CONFIRMED`
  - `order-expiration` 队列和 `PENDING_CONFIRMATION` 状态已实现基础设施，但当前主创建链路未接通
  - 活动抢票的 `Redis Lua + BullMQ + Worker + 数据库最终兜底` 已真实落地
  - 预约签到、缺席自动判定与按类别封禁机制已真实落地
  - `PaymentRecord` 与“幽灵支付”完整支付闭环当前仍未落地
- 已更新文档导航：
  - `docs/architecture/README.md`

### 当前状态

- 当前仓库已经有一套可直接用于汇报/答辩的“代码事实版”图表
- 推荐方案文档与当前实现之间的关键差异，现已被单独拉出并明确记录

### 下一步建议

1. 若目标是贴近比赛最终答辩，应优先补齐：
   - `PENDING_CONFIRMATION` 创建链路
   - `expireAt` 写入
   - 支付成功/超时取消并发闭环
2. 若目标是继续按当前代码答辩，应统一引用新的代码事实版图表与审计文档，不再混用旧的推荐方案图

### 注意事项

- 本轮为代码审计与文档更新，没有修改业务代码与接口语义

## 2026-04-21

### 已完成

- 已按最新需求调整任务清单并补正式跟踪：
  - 将 `PUX-006` 重新打开，原因是学生首页通知样例、管理员通知发布入口与 demo 账号快捷填充尚未完整达标
  - 新增 `PUX-010`，跟踪学生端多语言覆盖、订单/取消记录去重与管理员工作台冗余导航收口
  - 新增 `APP-017`，跟踪学生首页通知展示与管理员通知发布闭环
  - 新增 `APP-018`，跟踪学生报修工单与管理员工单接收闭环

### 当前状态

- 当前只完成 feature list 的纠偏与立项
- 通知、工单、多语言补齐、订单页去重和管理员导航收口都还未开始改代码

### 下一步建议

1. 先按 `PUX-010` 收口现有前端明显问题：全页多语言、订单/取消记录去重、管理员冗余导航删除
2. 再按 `APP-017` 补通知数据链路，确保学生首页通知区与管理员发布入口共用同一条数据流
3. 最后独立实现 `APP-018`，避免工单模型和通知模型在一轮里混改

### 注意事项

- 本轮没有修改业务代码与接口语义
- `PUX-006` 先前标记为完成，但按当前真实缺口应视为未完成，已在任务清单中纠偏

## 2026-04-21

### 已完成

- 已完成 `APP-016` 改动后的回归校验收口：
  - 运行 `pnpm lint`
  - 运行 `pnpm typecheck`
  - 运行 `pnpm test`
  - 运行 `pnpm build`
- 已修复回归校验中发现的唯一问题：
  - `apps/web/src/ui/pages/admin/workspaces/overview-workspace.tsx`
  - 拆分后遗留未使用的 `locale` 参数，导致 `web lint` 失败

### 当前状态

- 当前代码已通过仓库级 `lint / typecheck / build`
- 当前仓库未提供实际单元测试或集成测试任务，`pnpm test` 仅完成工作区扫描，没有执行业务测试用例

### 下一步建议

1. 若要更有把握回答“是否影响其他功能”，应补至少一组资源预约、管理员取消预约和签到窗口的自动化集成测试
2. 后续做边界拆分时，优先在同一提交内跑一次仓库级 lint，避免把这类静态回归留到后面收口

### 注意事项

- 本轮没有发现新的功能性构建错误
- 当前“无其他影响”的结论基于静态校验与构建通过，不等于真实业务流已被自动化用例完整覆盖

## 2026-04-21

### 已完成

- 已完成 `APP-016` 后端边界拆分收口：
  - 删除 `apps/api/src/modules/resource/resource.service.ts`
  - 新增 `resource-read.service.ts`、`resource-write.service.ts`、`resource-status.service.ts`
  - 新增 `resource.mapper.ts`，将资源响应映射和 Prisma/shared 类型转换收拢到单一文件
  - `resource.controller.ts` 已按读、写、状态三类服务注入，不再通过单个巨型 service 承担全部职责
- 已新增共享预约策略 helper：
  - `apps/api/src/modules/reservation/shared/reservation-policy.ts`
  - `reservation.service.ts`、`orders.service.ts`、`reservation-attendance-queue.service.ts` 已改为复用同一套预约类别判断、预约开始时间提取、签到窗口和考勤调度时间计算
- 本轮收口校验已通过：
  - `pnpm --filter api build`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- `APP-016` 已完成：
  - 前端 API 客户端已按领域拆分
  - 管理端工作台已按 workspace 拆分
  - 后端资源域已按 read / write / status / mapper 拆分
  - 预约策略重复逻辑已收拢为单一 helper

### 下一步建议

1. 如需继续做质量向收口，可优先补一组资源预约与管理员操作的集成测试，固定当前边界
2. 后续若继续拆分后台能力，保持按业务工作区推进，不要回退到跨工作区共享大状态页

### 注意事项

- 本轮未修改接口语义，目标是边界重组和重复策略收敛

## 2026-04-21

### 已完成

- 已完成管理员工作台页面首轮边界拆分：
  - `apps/web/src/ui/pages/admin-page.tsx` 收口为后台页面出口
  - 新增 `apps/web/src/ui/pages/admin/`
  - 后台概览、资源、活动、规则已按 workspace 分文件组织
  - workspace 内部各自持有 query、mutation 与表单状态，后台总入口仅负责工作区切换
- 本轮前端校验已通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- 前端请求层与后台工作台都已按模块边界完成首轮拆分
- `APP-016` 当前剩余后端资源域与预约策略共享逻辑的拆分收口

### 下一步建议

1. 拆分 `apps/api/src/modules/resource/resource.service.ts`，将读写、状态聚合和映射职责拆开
2. 将 `reservation` 与 `orders` 中重复的预约策略判断收拢到共享 helper

### 注意事项

- 本轮未改动后台接口语义，只调整管理端页面内部边界与组件组织

## 2026-04-21

### 已完成

- 已完成前端请求层首轮边界拆分：
  - 删除 `apps/web/src/lib/api.ts`
  - 新增 `apps/web/src/lib/http/`
  - 新增 `apps/web/src/lib/api/`
  - 现有页面已按认证、资源、活动、订单、规则分域引入 API
- 本轮前端校验已通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- 前端请求层已从“单文件业务 API + 刷新逻辑”拆为“通用 HTTP client + 分域 API 模块”
- 管理端页面与后端服务边界尚未开始拆分

### 下一步建议

1. 继续拆 `AdminPage`，将 query、mutation 和表单状态下放到各 workspace
2. 后续再拆后端 `resource.service.ts`，避免前后端同时大改造成排查困难

### 注意事项

- 本轮未变更任何接口语义，只调整前端请求边界与 import 组织

## 2026-04-21

### 已完成

- 已将后台、前端 API 与资源预约后端边界拆分蓝图正式入库：
  - `docs/architecture/admin-resource-reservation-boundary-refactor.md`
- 已新增对应 ADR：
  - `docs/adr/0007-admin-resource-reservation-boundary-refactor.md`
- 已在任务清单中新增跟踪项：
  - `APP-016`
- 已补文档系统入口：
  - `docs/architecture/README.md`
  - `docs/README.md`

### 当前状态

- 当前仅完成方案文档化与任务立项
- 业务代码尚未开始按该蓝图拆分

### 下一步建议

1. 以 `APP-016` 为主线，先拆前端 API 层，再拆后台页面与后端资源域
2. 正式实施拆分前，先锁定最小回归集：登录恢复、管理员取消预约、订单详情签到、资源预约状态查询

### 注意事项

- 本轮未修改业务代码与接口语义
- 本轮产出是后续重构的正式输入，而不是重构本身

## 2026-04-21

### 已完成

- 已在服务器上将 CampusBook 切换到正式公网模式
- 已补生产环境 `.env` 并生成新的生产演示账号口令与 JWT 相关密钥
- 已按正式链路完成：
  - 镜像构建
  - PostgreSQL / Redis 启动
  - Prisma migration deploy
  - demo seed
  - `api / worker / web / nginx` 启动
  - HTTPS Nginx 配置启用
- 已确认公网可访问：
  - `https://campusbook.top`
  - `https://www.campusbook.top`
  - `https://api.campusbook.top/health`
- 已确认 HTTP 会重定向到 HTTPS
- 已确认学生与管理员演示账号均可通过正式公网 API 登录
- 新增验证记录：
  - `docs/verification/2026-04-21/ops-production-public-deploy.md`
- 已修正文档中正式部署命令，显式要求使用 `--env-file .env`

### 当前状态

- 当前服务器正在运行正式公网模式，而不是 judge 模式
- 线上 `nginx` 当前监听 `80/443`
- PostgreSQL 与 Redis 当前只绑定 `127.0.0.1`，未直接暴露到公网

### 下一步建议

1. 如需长期公网运行，后续可继续补证书续期演练与容器重启后的恢复验证
2. 若不再需要演示账号，可进一步收掉 demo 口令或改为仅内部分发

### 注意事项

- 当前 PostgreSQL 使用的是已有数据卷
- 本轮发现正式部署时需要显式传入 `--env-file .env`，否则 compose 可能回退到默认开发值

## 2026-04-21

### 已完成

- 修复 GitHub Actions `quality` 任务失败
- 定位到真实失败原因为前端 lint 扫描 `apps/web/public/config.js` 时触发 `no-undef`
- 已在 `apps/web/eslint.config.mjs` 中排除 `public/config.js`
- 已将 CI 工作流中的 GitHub Actions 升级为 Node 24 兼容版本：
  - `actions/checkout@v6`
  - `pnpm/action-setup@v6`
  - `actions/setup-node@v6`
- 本轮本地校验已通过：
  - `pnpm prisma:generate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### 当前状态

- 当前 `quality` 工作流对应的本地命令链已全部通过
- Node 20 actions 弃用警告对应的工作流版本已完成升级

### 下一步建议

1. 推送本次提交后重新触发 GitHub Actions，确认远端 runner 侧无额外环境差异

### 注意事项

- 本轮未改业务逻辑，只修复 CI 配置与 lint 范围

## 2026-04-20

### 已完成

- 按用户反馈对 `PUX-009` 做第二轮收口，删除学生端与草图不一致的冗余展示内容
- `AppShell` 已简化为：
  - 精简顶部栏
  - 保留必要导航
  - 去掉大面积品牌展示与说明区
- 登录页已删去多余说明卡与演示性文案，仅保留：
  - 左侧展示区
  - 右侧登录输入区
  - 注册入口提示
- 首页已删去统计、最近记录和额外包装区，仅保留：
  - 顶部展示区
  - “去预约 / 我的订单”两个主按钮
  - 体育、学术、活动三个入口
- 体育预约页已删去概览型模块与重复说明，仅保留：
  - 资源信息
  - 时间表
  - 状态说明
  - 预约提交区
- 学术空间页与活动页已移除介绍型区块，改为更直接的预约/报名工作区
- 我的订单页、订单详情页、取消记录页已去掉统计卡、状态日志等扩展包装，只保留核心列表、总览信息和必要操作
- 本轮校验已通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- 学生端页面结构当前更贴近用户原始草图，不再保留大段产品包装型内容
- `PUX-009` 当前已从“完整原型”收口到“以预约流程为主的简洁版原型”

### 下一步建议

1. 如需继续严格贴草图，可进一步收紧登录区字段结构和订单详情按钮命名
2. 若要进入答辩或演示阶段，可补录一版按真实流程操作的页面截图

### 注意事项

- 本轮未改动 judge/deploy 相关未提交文件
- 本轮主要是前端信息架构收口，没有变更后端接口语义

## 2026-04-20

### 已完成

- 完成 `PUX-009`：按校园预约平台草图重构学生端前端原型
- 登录入口页已改为：
  - 左侧展示区
  - 右侧登录注册区
- 学生首页已改为：
  - 展示区
  - “去预约 / 我的订单”两个主操作按钮
  - 体育、学术、活动三个核心入口
- 体育预约页已重构为三栏工作区：
  - 左侧资源信息
  - 中间时段表
  - 右侧状态说明与预约提交区
- 订单体系已拆分为：
  - `我的订单` 列表页
  - `订单详情` 页
  - `取消记录` 页
- 学术空间预约成功后已跳转到对应订单详情页
- 活动报名状态区若已有订单，已可直接跳转到订单详情页
- 为学生端时段表新增脱敏只读接口：
  - `GET /resources/:id/reservation-status`
- 新增 ADR：
  - `docs/adr/0006-public-resource-reservation-status-for-student-schedule.md`
- 新增验证记录：
  - `docs/verification/2026-04-20/pux-009-student-frontend-prototype.md`
- 本轮校验已通过：
  - `pnpm --filter api build`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`

### 当前状态

- `PUX-009` 当前可视为已完成
- 学生端主流程当前已形成：
  - 登录入口
  - 首页选资源
  - 体育/学术/活动进入预约
  - 订单详情回看状态
  - 取消记录查历史

### 下一步建议

1. 如需进一步贴近最终答辩展示，可继续补浏览器截图或录屏证据
2. 若后续要让学术空间页也显示真实占用时间表，可复用本轮新增的脱敏状态接口模式

### 注意事项

- 本轮同时改动了前端路由、学生端页面和一个公共只读资源状态接口
- 学生端时段表当前只暴露脱敏后的资源占用信息，不返回他人身份字段

## 2026-04-20

### 已完成

- 已将用户提供的校园预约平台前端草图要求正式入库：
  - 新增 `docs/architecture/pux-009-student-frontend-prototype.md`
  - 已把入口页、首页、资源预约页、订单详情页、我的订单页、取消记录页与整条学生端流程闭环整理为正式需求稿
- `docs/plans/feature-list.json` 已新增 `PUX-009`
- 文档导航已补充：
  - `docs/README.md`
  - `docs/architecture/README.md`

### 当前状态

- 学生端前端原型需求当前已经不只存在聊天记录中，后续实现可直接以 `PUX-009` 和专项需求稿作为正式输入
- 当前仍未开始页面实现，本轮工作只完成需求沉淀与文档化

### 下一步建议

1. 以 `docs/architecture/pux-009-student-frontend-prototype.md` 为基线，继续补页面结构、路由映射和关键交互的执行方案
2. 在得到批准后，再开始实际前端页面改造

### 注意事项

- 本轮主要是文档沉淀，不涉及业务代码与接口行为变更
- 若后续实现需要新增预约状态查询接口或调整现有页面拆分，应单独记录实现决策

## 2026-04-20

### 已完成

- 将安装与部署入口拆分为两条路径：
  - `Judge Mode`
  - `Production Mode`
- 新增评委验收手册 `docs/standards/judge-quick-start.md`
- 新增 ADR `docs/adr/0005-split-judge-and-production-deployment-paths.md`
- 根 README 已新增“评委验收最短路径”入口
- 新增 `.env.judge.example`
- 新增一键 judge 启动脚本 `scripts/judge-up.sh`
- 新增 judge smoke 脚本 `scripts/smoke-judge.mjs`
- 新增 `infra/docker-compose.judge.yml`
- 新增 `infra/nginx/judge-conf.d/default.conf`
- `web` 镜像已补运行时配置注入与 SPA 回退：
  - `infra/docker/40-write-runtime-config.sh`
  - `infra/docker/web-default.conf`
  - `apps/web/public/config.js`
- 前端 API 地址当前改为：
  - 运行时配置优先
  - 构建期变量次之
  - 最后才使用默认推导
- 当前 judge 模式通过 Nginx 将 API 统一挂到 `/api`
- judge 模式已通过 `proxy_cookie_path` 将 refresh cookie 的 `Path` 从 `/auth` 重写到 `/api/auth`
- `docker-compose.yml` 当前已改为显式传递 API/worker 所需环境变量，不再依赖容器内读取 `.env.example`
- `postgres` 与 `redis` 已补健康检查，便于脚本按顺序等待依赖就绪
- 新增验证证据：
  - `docs/verification/2026-04-20/ops-judge-one-command-deploy.md`
- 本轮已完成最小校验：
  - `docker compose --env-file .env.example -f infra/docker-compose.yml config`
  - `docker compose --env-file .env.judge.example -f infra/docker-compose.yml -f infra/docker-compose.judge.yml config`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
  - `docker compose --env-file .env.judge.example -f infra/docker-compose.yml -f infra/docker-compose.judge.yml build web`
  - `bash scripts/judge-up.sh .env.judge.example`
- judge 一键脚本本轮已完整通过：
  - 镜像构建
  - 数据库迁移
  - demo seed
  - judge smoke 校验
  - 栈停止清理

### 当前状态

- 当前仓库已同时具备：
  - 评委验收一键入口
  - 正式公网部署手册
  - HTTPS 升级与续期手册
- 评委环境当前不再依赖真实域名与 HTTPS
- 正式公网部署链路仍保持原有 `campusbook.top / www / api` 结构

### 下一步建议

1. 继续执行一次完整的 judge 模式容器联调，留一份验证证据到 `docs/verification/`
2. 若后续需要关闭数据库与 Redis 的宿主机端口映射，可再单独补一轮编排收口
3. 如果 judge 模式未来要支持自定义端口与多实例运行，可继续把更多端口与路径参数化

### 注意事项

- 本轮改动同时涉及部署编排、前端运行时配置和文档入口
- judge 入口与 production 入口已经分离，后续不要再把证书申请写进评委验收路径
- 当前工作区若存在其他业务开发改动，部署相关提交应继续独立维护

## 2026-04-20

### 已完成

- 新增新服务器部署手册 `docs/standards/new-server-deployment-playbook.md`
- 手册当前已收口为“首次上线最短路径”，覆盖：
  - 拉代码
  - `.env` 生产配置
  - 顺序构建镜像
  - 数据库迁移
  - 演示数据初始化
  - HTTP 验证
  - HTTPS 证书申请
  - 正式启用 `443`
- 已补 `docs/README.md` 入口，后续可直接从文档总入口找到部署手册
- 已修正文档中的首次证书申请说明：
  - `webroot` 模式下不再要求为 `certbot` 额外挂载 `80:80`
  - 保持运行中的 `nginx` 响应 ACME challenge

### 当前状态

- 当前仓库已同时具备：
  - 部署基线文档
  - 新服务器首次部署手册
  - HTTPS 切换与续期手册
- 若继续使用 `campusbook.top / www / api` 这组域名，首次上线步骤已经收口为可直接执行的顺序命令
- 若后续需要支持新域名复用，下一步应继续把 `Nginx` 与前端默认 API 域名做参数化

### 下一步建议

1. 后续如需频繁新建环境，可继续补一份 `.env.production.example`
2. 再向前一步可增加 `make deploy` 或等价脚本，把迁移与启动收口为更少命令
3. 若准备支持换域名部署，应优先去掉 `campusbook.top` 的硬编码

### 注意事项

- 本次只补文档，不改动现有业务代码与运行编排
- 工作区当前存在用户未提交的业务开发改动，文档提交应与这些改动分开
- 首次部署仍需要人工执行数据库迁移与证书申请，不是一条命令全自动上线

## 2026-04-19

### 已完成

- 修复登录页示例账号导致的非法字段提交问题
- 根因已确认：
  - 登录页的示例账号对象包含 `label`
  - 点击“自动填充”后直接把整对象写进表单状态
  - 提交登录时把 `label` 一并发给了 `/auth/login`
  - 后端 DTO 校验因此返回 `property label should not exist`
- `apps/web/src/ui/pages/login-page.tsx` 已改为：
  - 登录表单状态只保留 `email/password`
  - 点击示例账号时只回填 `email/password`，不再带 `label`
- 本轮前端已通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
- 已低负载热刷新线上 `web` 容器
- 线上首页当前返回的新前端资源：
  - `index-BPcO5s7o.js`
  - `index-CJKyMaj0.css`
- 已通过接口验证：
  - 只提交 `email/password` 时登录成功
  - 带 `label` 时后端仍会按预期返回 `property label should not exist`
- 新增验证证据：
  - `docs/verification/2026-04-19/bugfix-login-label-payload.md`
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

## 2026-04-20

### 已完成

- 完成 `PUX-008`：将中英文切换扩展到核心导航、登录页、学生首页和教师工作台首页
- `apps/web/src/ui/app-shell.tsx` 已新增全局语言切换入口，并完成以下文案双语化：
  - 顶层导航
  - 当前模块标题与说明
  - 壳层状态区与身份提示
  - 登录后与访客态的主要按钮
- `apps/web/src/ui/pages/login-page.tsx` 已完成双语化：
  - 标题
  - 描述
  - 表单字段标签
  - 登录按钮
  - 登录提示
  - 示例账号说明
- `apps/web/src/ui/pages/home-page.tsx` 已完成学生首页双语化：
  - 首页标题与说明
  - 三个主入口卡片
  - 历史记录区
  - 近期活动通知栏
- `apps/web/src/ui/pages/admin-page.tsx` 已完成教师工作台首页双语化：
  - 工作台标题与说明
  - 当前工作区摘要
  - 工作区导航
  - 总览页说明与核心卡片
- 语言选择继续使用 `localStorage` 持久化，键为 `campusbook.locale`
- 新增验证证据：
  - `docs/verification/2026-04-20/pux-008-bilingual-core-pages.md`
- 本轮前端已通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web lint`
  - `pnpm --filter web build`
- 已以低负载方式将新的 `apps/web/dist` 同步到 `infra-web-1`
- 线上 `https://campusbook.top` 当前开始返回新的前端资源：
  - `index-CA0gmNMI.js`
  - `index-CGgUna4x.css`
- 开始执行 `PUX-007`，完成访客可见范围收口
- `apps/web/src/routes.tsx` 已将以下学生端页面挂到新的学生门户守卫下：
  - `/spaces`
  - `/sports`
  - `/activities`
  - `/orders`
- 新增 `RequireStudentPortal`：
  - 未登录访问学生端页面时跳转到登录页
  - 管理身份访问学生端页面时重定向到 `/admin`
- `apps/web/src/ui/app-shell.tsx` 已收窄访客导航：
  - 访客不再看到体育空间、校园活动、学术空间入口
  - 访客导航仅保留登录入口
- `apps/web/src/ui/pages/home-page.tsx` 已收口访客首页：
  - 不再展示“登录后你会看到什么”等扩展说明区块
  - 首页仅保留统一登录入口和语言切换
- 新增语言切换底座：
  - `apps/web/src/store/locale-store.ts`
  - `apps/web/src/lib/locale.ts`
  - 当前已支持访客首页与访客壳层的中英文切换和本地持久化
- 新增验证证据：
  - `docs/verification/2026-04-20/pux-007-guest-access-restrictions.md`
- 本轮前端已通过：
  - `pnpm --filter web typecheck`
  - `pnpm --filter web lint`
  - `pnpm --filter web build`
- 已以低负载方式将新的 `apps/web/dist` 同步到 `infra-web-1`
- 线上 `https://campusbook.top` 当前开始返回新的前端资源：
  - `index-DHx9VHwb.js`
  - `index-DBUOT101.css`
- 根据新的产品需求，扩展 `docs/plans/feature-list.json`
- 新增 4 个后续任务：
  - `PUX-007`
    - 未登录首页只展示登录入口
    - 访客不可直接浏览资源列表
  - `PUX-008`
    - 首页和核心页面增加中英文切换
  - `APP-012`
    - 预约可添加同行人
    - 预约开始前后 10 分钟内任一人签到即算签到成功
    - 若全部未签到，则自动取消预约并释放资源
  - `APP-013`
    - 按预约类别累计违约
    - 单类别违约超过 2 次，禁用该类别预约功能 1 周
- 继续补充管理员端需求，新增 2 个后续任务：
  - `APP-014`
    - 管理员查看资源列表
    - 支持按每天/每周/每月同一时间为某个或多个资源设置释放时间
  - `APP-015`
    - 管理员取消学生预约
    - 管理员关闭某个或多个资源的预约通道
    - 管理员查看资源预约状态
    - 支持指定时间段关闭，或从当前时间开始不再接受预约
- 完成 `APP-012`：为资源预约补齐同行人、签到和释放规则
- `packages/shared-types/src/index.ts` 已扩展：
  - 预约请求支持 `companionEmails`
  - 订单详情增加 `reservationCategory`、签到窗口和同行人明细
  - 新增签到响应类型
- Prisma 已新增并完成迁移：
  - `ReservationParticipant`
  - `UserReservationRestriction`
  - `ReservationCategory`
  - `apps/api/prisma/migrations/20260420093446_reservation_attendance_and_restrictions`
- `apps/api/src/modules/reservation/reservation.service.ts` 已完成：
  - 学术空间与体育设施预约支持同行人邮箱列表
  - 创建预约时同时写入主持人和同行人参与记录
  - 新增 `POST /reservations/:orderId/check-in`
  - 预约在开始前后 `10` 分钟内允许参与人签到
- `apps/api/src/modules/orders/` 已新增预约签到评估队列与 worker：
  - `reservation-attendance.constants.ts`
  - `reservation-attendance-queue.service.ts`
  - `reservation-attendance-worker.service.ts`
- 预约开始后 `10` 分钟若全员未签到，系统会：
  - 将预约订单标记为 `no_show`
  - 释放学术空间或体育设施占用
  - 记录对应类别的违约次数
- 完成 `APP-013`：按类别累计违约并禁用预约一周
- `UserReservationRestriction` 已按类别维护：
  - `violationCount`
  - `bannedUntil`
  - `lastViolatedAt`
- 当同一用户在同一类别累计违约超过 `2` 次时：
  - 系统会禁用该类别预约 `7` 天
  - 被禁用期间提交预约时会返回明确错误，例如 `reservation-category-disabled:<email>:<until>`
- 为联调补充演示账号：
  - `partner1@campusbook.top`
  - `partner2@campusbook.top`
  - 当前演示学生密码仍统一为 `demo123456`
- 学生端预约表单已支持录入同行人邮箱：
  - `apps/web/src/ui/pages/spaces-page.tsx`
  - `apps/web/src/ui/pages/sports-page.tsx`
- 订单页已新增签到与同行人面板：
  - 展示签到开放/截止时间
  - 展示主持人/同行人列表与签到状态
  - 参与人可在有效窗口内直接签到
- 本轮验证已通过：
  - `pnpm --filter api typecheck`
  - `pnpm --filter api lint`
  - `pnpm --filter api build`
  - `pnpm --filter api seed:demo`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web lint`
  - `pnpm --filter web build`
- 已完成联调验证：
  - 同行人可在预约开始前后 `10` 分钟窗口内签到
  - 任一同行人签到后，预约在签到评估任务执行后仍保持 `confirmed`
  - 连续 `3` 次未签到会使该类别违约累计为 `3`
  - 第 `4` 次提交同类别预约时被拦截，并返回禁用到期时间
- 已新增验证证据：
  - `docs/verification/2026-04-20/app-012-013-attendance-and-category-ban.md`
- 为避免继续抬高宿主机负载，联调用的本机 `api/worker` 进程已在验证后关闭
- 完成 `APP-014`：为管理员端补齐资源列表与周期性资源释放配置
- Prisma 已新增并完成迁移：
  - `ResourceReleaseFrequency`
  - `ResourceReleaseRule`
  - `apps/api/prisma/migrations/20260420103020_admin_resource_release_and_closure`
- `apps/api/src/modules/resource/` 已补齐：
  - 放号规则 DTO
  - 预约关闭 DTO
  - 资源预约状态查询 DTO
  - `resource-channel.ts` 通道状态计算
- `AdminResourceController` 已新增：
  - `POST /admin/resources/release-rules`
  - `PATCH /admin/resources/release-rules/:id`
- `ResourceService` 已扩展：
  - 管理端资源详情返回放号规则、预约关闭规则和当前通道状态
  - 支持按天、周、月配置某个或多个资源的放号时间
  - 支持计算当前周期放号时间和下一次放号时间
- 完成 `APP-015`：为管理员端补齐预约通道控制、学生预约取消与资源预约状态查看
- `AdminResourceController` 已新增：
  - `POST /admin/resources/closures`
  - `PATCH /admin/resources/closures/:id`
  - `GET /admin/resources/:id/reservation-status`
- 预约创建流程已接入资源通道规则：
  - 若资源尚未到达当前周期放号时间，则拦截预约
  - 若资源存在与预约时间重叠的关闭规则，则拦截预约
- 管理端资源工作区已扩展：
  - 资源列表显示当前通道状态
  - 可为一个或多个资源配置放号规则
  - 可为一个或多个资源配置预约关闭规则
  - 可查看某时间窗口内的预约状态和关闭记录
  - 可直接取消学生预约
- 本轮验证已通过：
  - `pnpm --filter api typecheck`
  - `pnpm --filter api lint`
  - `pnpm --filter api build`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
- 已完成本机 API 联调验证：
  - 管理员资源列表返回 `releaseRules`、`bookingClosures` 和 `channelStatus`
  - 放号时间设为未来时，学生预约被 `resource-not-yet-released` 正确拦截
  - 调整放号时间到过去后，学生预约可成功创建
  - 配置关闭规则后，学生预约被 `resource-booking-closed` 正确拦截
  - `GET /admin/resources/:id/reservation-status` 能返回预约记录和关闭记录
  - 管理员通过 `POST /orders/:id/cancel` 可取消学生预约
- 已新增验证证据：
  - `docs/verification/2026-04-20/app-014-015-admin-resource-operations.md`
- 本轮联调用的本机 `api:3001` 进程已在验证后关闭

### 当前状态

- `APP-015` 已完成
- `APP-014` 已完成
- `APP-013` 已完成
- `APP-012` 已完成
- `PUX-008` 已完成
- `PUX-007` 已完成
- 当前正式任务清单已覆盖最新提出的访客收口、双语、同行人签到、违约惩罚与管理员资源运营需求
- 资源预约当前已经支持同行人、签到窗口、自动爽约释放与按类别禁用
- 管理员端当前已经支持资源列表、周期性放号、预约关闭、预约状态查询和管理员取消预约
- 双语功能当前已覆盖首页级核心页面，但更深层业务页和后台表单仍可继续扩展

### 下一步建议

1. 开始执行 `PUX-005`，补浏览器级真实回归和最终截图证据
2. 低峰期再做一次正式镜像级部署收口，替代当前开发阶段的轻量热刷新
3. 后续可继续扩展更深层业务页和后台表单的英文文案覆盖

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
