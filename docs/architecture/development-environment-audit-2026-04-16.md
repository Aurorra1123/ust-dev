# Development Environment Audit 2026-04-16

## 结论

在“不依赖 conda”的前提下，当前服务器已经满足文档设计、仓库初始化和容器优先开发的基础需求，但还不满足“开箱即用的完整开发环境”。

当前判断：

- 可以开始初始化 monorepo、前后端骨架和 Docker Compose
- 可以走容器优先的 PostgreSQL、Redis、Nginx、API 本地联调
- 暂不适合把大量服务都以宿主机原生命令直接维护
- 在真正开始开发前，建议先补齐 `pnpm` 并控制内存占用

## 核查结果

| 项目 | 命令 | 结果 | 判断 | 说明 |
|---|---|---|---|---|
| OS | `uname -a` | `Linux 5.10.134-17.2.al8.x86_64` | 通过 | 与部署基线一致 |
| Shell | `bash --version` | `GNU bash 4.4.20` | 通过 | 满足脚本执行需求 |
| Git | `git --version` | `2.43.5` | 通过 | 可支撑常规协作 |
| Node.js | `node --version` | `v20.20.2` | 通过 | 满足 React / NestJS 基础要求 |
| npm | `npm --version` | `10.8.2` | 通过 | 可作为临时包管理器 |
| corepack | `corepack --version` | `0.34.6` | 通过 | 后续可用来激活 `pnpm` |
| Docker CLI | `docker --version` | `26.1.3` | 通过 | 客户端已安装 |
| Docker daemon | `docker info --format '{{.ServerVersion}}'` | `26.1.3` | 通过 | 服务端可访问 |
| Docker Compose | `docker compose version` | `v2.27.0` | 通过 | 满足单机编排需求 |
| OpenSSL | `openssl version` | `1.1.1k` | 通过 | 可支撑证书相关操作 |
| Python | `python3 --version` | `3.6.8` | 有条件通过 | 不是本方案核心运行时，但版本偏旧 |
| pnpm | `pnpm --version` | 未安装 | 未通过 | monorepo 推荐方案尚未就绪 |
| nginx | `nginx -v` | 未安装 | 有条件通过 | 若走容器化 Nginx 不构成阻塞 |
| psql | `psql --version` | 未安装 | 有条件通过 | 不阻塞容器开发，但宿主机调试不便 |
| redis-server | `redis-server --version` | 未安装 | 有条件通过 | 不阻塞容器开发，但宿主机调试不便 |
| micromamba | `micromamba --version` | 未安装 | 不评估 | 用户已确认本轮可不使用 conda |

## 资源状态

### 内存

`free -h` 结果：

- 总内存：`1.8 GiB`
- 可用内存：约 `903 MiB`
- Swap：`0`

影响：

- API、Worker、PostgreSQL、Redis、Nginx 同机运行时内存会比较紧
- 不建议同时拉起过多开发容器、监控栈或重型依赖
- 建议在进入开发阶段前增加 swap，或至少限制各服务内存

### 磁盘

`df -h /data/ustdev/ust-dev` 结果：

- 总容量：`59G`
- 已用：`5.5G`
- 可用：`51G`

判断：

- 当前磁盘空间充足

## 仓库状态判断

当前仓库仍以文档为主，尚未出现以下运行骨架：

- `apps/web`
- `apps/api`
- `infra/docker-compose.yml`
- `infra/nginx/`

这意味着：

- 服务器环境已具备“开始搭建”的基础
- 但还不具备“直接启动业务系统”的条件

## 建议动作

1. 安装或激活 `pnpm`
2. 建立 monorepo 基础目录
3. 编写 `docker-compose.yml`
4. 以容器方式提供 PostgreSQL、Redis 与 Nginx
5. 在真正部署前补齐 HTTPS 证书与 `443` 配置
