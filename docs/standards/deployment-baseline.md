# Deployment Baseline

## 目标

固化当前项目的长期有效部署基线，确保后续前后端部署、Nginx 分流和 HTTPS 升级都基于同一套约束执行。

## 服务器信息

- OS: `Linux 5.10.134-17.2.al8.x86_64`
- Shell: `bash`
- Repo Path: `/data/ustdev/ust-dev`
- Public IP: `47.251.174.28`
- Private IP: `172.18.8.226`
- Resource: `2 vCPU / 2 GiB RAM / 60 GiB disk`
- Docker: `26.1.3`

## 域名结构

- `campusbook.top` -> frontend
- `www.campusbook.top` -> frontend
- `api.campusbook.top` -> backend

以上域名解析已确认指向 `47.251.174.28`。

## Nginx 路由要求

- 必须基于 `server_name` 区分前端与后端流量
- 前端必须同时支持裸域 `campusbook.top` 和 `www.campusbook.top`
- 后端必须使用 `api.campusbook.top`
- 当前阶段先提供 HTTP 配置
- 配置结构必须便于后续无缝升级到 HTTPS

## 推荐 HTTP 站点划分

### frontend server

- `listen 80`
- `server_name campusbook.top www.campusbook.top`
- 提供前端静态资源或反向代理到前端服务

### backend server

- `listen 80`
- `server_name api.campusbook.top`
- 反向代理到后端应用服务

## HTTPS 升级约束

- 不改变域名分工
- 不改变基于 `server_name` 的路由边界
- HTTPS 证书需要覆盖 `campusbook.top`、`www.campusbook.top`、`api.campusbook.top`
- 升级时优先在现有 server block 结构上补充 `listen 443 ssl` 与跳转逻辑，避免重做路由设计

## 运维要求

- 部署文档中的域名、端口、服务归属必须与本文件一致
- 如果后续变更域名结构、反向代理边界或发布拓扑，必须新增 ADR 记录
