# ADR 0025：judge-up 在 seed 前重置数据库

## 状态

已接受

## 背景

`COMP-005` 要求 `judge-up` 连续执行保持幂等，同时 `smoke-judge` 不再只是健康检查，而是会真实创建：

- 学术预约并取消
- 体育预约并取消
- 付费活动票从待支付到确认

如果 judge 路径仍沿用“只执行 `migrate deploy` + `seed` upsert”的方式，重复运行会保留上一次 smoke 产生的订单、报名和活动数据，无法保证第二次启动仍是同一条演示基线。

## 决策

1. `scripts/judge-up.sh` 在 seed 前执行：
   - `pnpm --filter api exec prisma migrate reset --force --skip-generate --skip-seed`
2. judge 路径继续保留：
   - 独立 `postgres` / `redis`
   - demo seed
   - 启动后立即执行 `smoke-judge`
3. `smoke-judge` 升级为真实业务 smoke，并与 `smoke-live` 复用同一套业务步骤实现

## 影响

- 连续重复执行 `judge-up` 时，数据库会被重置回同一份演示基线
- judge smoke 现在可以安全创建临时订单和活动，而不会把上一次验收的业务残留带到下一次
- 该路径明确是“评委 / 临时验收环境”，不是生产保留数据部署路径

## 不采纳的方案

### 继续只做 `migrate deploy` + `seed upsert`

不采纳。随着 smoke 脚本引入真实业务流，这种方式不能保证重复执行后的数据基线一致。

### 在 smoke 里避免任何写操作

不采纳。这样无法满足比赛对“真实业务链路”验收的要求。
