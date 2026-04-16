# ADR 0003: Use Domain-Based Nginx Routing For Frontend And Backend

## Status

Accepted

## Context

项目已完成以下域名解析，并统一指向公网地址 `47.251.174.28`：

- `campusbook.top`
- `www.campusbook.top`
- `api.campusbook.top`

需要明确长期有效的流量分发边界，避免后续部署时前后端混用同一个站点入口，或者在 HTTP 迁移 HTTPS 时重做整体配置。

## Decision

采用基于域名的 Nginx 路由方案：

- 前端使用 `campusbook.top` 与 `www.campusbook.top`
- 后端使用 `api.campusbook.top`
- Nginx 必须通过 `server_name` 区分前后端流量
- 当前阶段先落 HTTP 配置
- 后续升级 HTTPS 时保持相同域名分工和路由边界

长期部署基线维护在 `docs/standards/deployment-baseline.md`。

## Consequences

- 前后端边界清晰，部署与排障成本更低
- 前端可以同时覆盖裸域和 `www`
- 后端 API 入口稳定，便于跨端调用和证书管理
- HTTPS 升级时只需扩展现有结构，而不需要重新设计域名映射
