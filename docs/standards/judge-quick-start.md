# Judge Quick Start

## 目标

为评委或临时验收环境提供一条不依赖真实域名、不依赖 HTTPS 的最短启动路径。

启动成功后，直接访问：

- `http://服务器IP:8080`

## 适用场景

- 比赛评委验收
- 临时服务器演示
- 不想先处理 DNS、证书和公网域名

如果你要的是正式公网部署，请改看：

- `docs/standards/new-server-deployment-playbook.md`
- `docs/standards/https-deployment-playbook.md`

## 前提

- 已安装 `git`
- 已安装 `docker`
- 已安装 `docker compose`

## 最短路径

### 1. 拉代码

```bash
mkdir -p /data/ustdev
cd /data/ustdev
git clone <你的仓库地址> ust-dev
cd /data/ustdev/ust-dev
```

### 2. 准备 judge 环境文件

```bash
cp .env.judge.example .env.judge
```

默认情况下无需再改，直接可用。

### 3. 一键启动

```bash
bash scripts/judge-up.sh
```

脚本会顺序完成：

1. 构建 `api` 与 `web` 镜像
2. 启动 `postgres` 与 `redis`
3. 执行数据库迁移
4. 写入 demo 数据
5. 启动 `api / worker / web / nginx`
6. 执行 judge smoke 校验

### 4. 打开系统

```text
http://服务器IP:8080
```

默认演示账号：

- 学生：`demo@campusbook.top / demo123456`
- 管理员：`admin@campusbook.top / admin123456`

## 停止与清理

停止容器：

```bash
docker compose \
  --env-file .env.judge \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.judge.yml \
  down
```

连同数据库卷一起清理：

```bash
docker compose \
  --env-file .env.judge \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.judge.yml \
  down -v
```

## 说明

- judge 模式统一通过同一入口提供页面与 API
- API 统一挂在 `/api`
- 不要求 DNS
- 不要求 HTTPS
- 不要求 `campusbook.top` 已解析到当前机器
