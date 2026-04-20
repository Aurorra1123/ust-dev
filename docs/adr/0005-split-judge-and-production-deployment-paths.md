# ADR 0005: Split Judge And Production Deployment Paths

## Status

Accepted

## Context

当前仓库原本只有一套偏正式公网环境的部署链路，默认依赖：

- `campusbook.top`
- `www.campusbook.top`
- `api.campusbook.top`
- `80/443`
- Let’s Encrypt 证书

这条路径适合正式演示和长期运行，但不适合比赛评委的“一键拉起完整应用”验收口径。评委更需要的是：

- 不依赖真实域名
- 不依赖 HTTPS
- 不需要先手工申请证书
- 用单一入口即可打开前端并访问 API

同时，当前前端 API 地址和 Nginx 路由存在对正式域名结构的默认假设，需要一套更适合 judge 场景的收口方式。

## Decision

采用双部署路径：

- `Judge Mode`
  - 单入口 `http://<ip>:8080`
  - 页面走 `/`
  - API 走 `/api`
  - 不依赖 DNS 与 HTTPS
- `Production Mode`
  - 保留 `campusbook.top / www / api` 三域名结构
  - 继续使用现有 HTTPS 部署与续期流程

同时补以下实现约束：

- 前端 API 地址改为运行时配置优先，而不是只依赖构建期环境变量
- judge 模式通过 Nginx 将 API 暴露到 `/api`
- judge 模式由 Nginx 重写 refresh cookie 的 `Path`，避免 `/api/auth` 与原始 `/auth` 路径不一致
- 仓库内新增一键 judge 启动脚本，串起构建、迁移、seed、启动和最小 smoke 校验

## Consequences

- 评委验收路径与正式公网部署路径不再混用，文档和操作成本明显下降
- 正式 HTTPS 文档可以继续保持稳定，不必为评委环境增加额外复杂度
- 前端静态站点获得运行时 API 配置能力，后续换环境时不必强依赖重新构建镜像
- 部署编排比之前多了一份 judge override 和对应脚本，需要持续维护两条入口
