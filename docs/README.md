# Docs System

本目录分为两层：

- `reference/`：原始或整理后的参考材料
- `plans/`、`progress/`、`standards/`、`adr/`、`architecture/`、`verification/`：agent 和人工协作时的执行层

## 目录说明

- `reference/`：业务背景、需求重建稿、图示、原始 PDF
- `plans/`：任务拆解、里程碑、待办状态
- `progress/`：会话级进度记录和交接信息
- `standards/`：工程规则、git 工作流、agent 执行规则、部署基线
- `adr/`：架构决策记录
- `architecture/`：正式技术方案、架构图、环境核查
- `verification/`：验证证据、截图、测试与回归结果
- `exec-plan/`：面向当前阶段的执行计划文档

## 关键入口

- `standards/reference-mapping.md`：reference 输入材料与正式入口的映射关系
- `standards/engineering-rules.md`：通用工程规则
- `standards/git-workflow.md`：git 提交与会话流程
- `standards/agent-harness-rules.md`：长周期 agent 执行规则
- `standards/business-rules-baseline.md`：当前正式业务规则入口
- `standards/deployment-baseline.md`：部署环境、域名与 Nginx 分流基线
- `standards/new-server-deployment-playbook.md`：新服务器首次部署最短路径
- `standards/https-deployment-playbook.md`：HTTPS 升级与证书部署手册
- `verification/README.md`：验证证据存放规范
- `adr/0001-repo-as-agent-memory.md`：仓库作为 agent 主记忆体
- `adr/0004-single-node-typescript-platform-baseline.md`：当前技术基线决策
- `architecture/product-baseline.md`：当前正式产品范围与用户路径
- `architecture/productization-plan-v1.md`：当前产品化改造方案
- `architecture/domain-model-baseline.md`：当前正式领域模型入口
- `architecture/technical-solution-v2.md`：当前推荐技术方案
- `architecture/architecture-diagrams.md`：架构图与流程图
- `architecture/development-environment-audit-2026-04-16.md`：当前服务器开发环境核查

## 推荐工作流

1. 先阅读 `progress/agent-progress.md` 和 `plans/feature-list.json`
2. 抽样回归 1-2 个已通过的核心功能
3. 确认当前最高优先级且未完成的任务
4. 小步修改
5. 自检并保存验证证据
6. 更新进度文档与任务状态
7. 提交 git commit 并保持工作区干净

## 当前目标

当前仓库已完成首轮参考资料正式化、核心产品开发和 HTTPS 上线。后续文档工作的重点是：

- 保持正式入口与代码实现同步
- 维护验证证据和回归样本
- 持续降低新会话对 `reference/` 原始材料的直接依赖
