# Agent Progress Log

本文件用于跨会话交接，任何一次较完整的工作结束前都应更新。

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

### 当前状态

- 仓库已经具备基础协作骨架
- 现有参考资料尚未映射到正式的信息架构
- 已形成 agent 执行规则与部署基线的长期文档入口
- 域名分流规则已明确为前端裸域与 `www`，后端 `api` 子域
- 已形成当前推荐技术方案 V2 与配套架构图
- 当前服务器满足文档与容器优先开发的基础要求，但尚未安装 `pnpm`
- 尚待后续补充应用骨架、Nginx 配置模板与 Docker Compose

### 下一步建议

1. 提交当前骨架作为初始基线
2. 建立首轮执行计划，定义 docs 系统第一阶段目标
3. 逐份梳理 `docs/reference/`，将内容转成正式文档结构
4. 基于 `docs/standards/deployment-baseline.md` 编写实际部署文档与 Nginx 配置模板
5. 按 `docs/architecture/technical-solution-v2.md` 初始化 monorepo 与运行骨架

### 注意事项

- 后续 agent 开始工作前，先读本文件和 `docs/plans/feature-list.json`
- 每次只推进一个高优先级任务，避免同时改太多内容
