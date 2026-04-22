# QA-007 COMP-005 真实业务测试与 judge 回归证据

## 目标

验证 `COMP-005` 已把前几阶段的真实能力收口成统一门槛：

- API 自动化回归继续覆盖支付、库存、规则，并新增异步骨干与动态规则验证
- `smoke-judge` / `smoke-live` 不再只是健康检查，而是覆盖真实业务链路
- `judge-up` 连续执行具备数据基线重置能力，避免前一次 smoke 污染下一次验收

## 本轮实现

- 新增 `COMP-005` API 回归：
  - `apps/api/test/comp-005-business-regressions.test.ts`
- 新增共享 smoke 实现：
  - `scripts/smoke-suite.mjs`
  - `scripts/smoke-judge.mjs`
  - `scripts/smoke-live.mjs`
- 更新 judge 启动路径：
  - `scripts/judge-up.sh`
- 更新 judge 使用说明：
  - `docs/standards/judge-quick-start.md`

## 关键行为

### API 自动化回归新增覆盖

- delayed expiration worker 会自动取消待支付订单
- 同用户跨票种不能形成同活动双报名
- 规则停用后立即失效、启用后立即生效

### smoke 场景升级

`smoke-judge` 与 `smoke-live` 现在共享同一套真实业务场景：

- 学术预约成功后取消
- 体育预约成功后取消
- 学术最大时长规则命中
- 创建一张临时 `5` 元付费活动票并从待支付走到支付确认

其中活动票链路会等待报名队列产出订单，因此当 worker 缺失时 smoke 会直接失败，不再出现“页面能打开但异步骨干已坏”的假绿情况。

### judge-up 幂等基线

- 每次 `judge-up` 都会先 `prisma migrate reset`
- 再写入 demo seed
- 然后启动 `api / worker / web / nginx`
- 最后执行升级后的 `smoke-judge`

## 验证命令

```bash
pnpm --filter api typecheck
node --check scripts/smoke-suite.mjs
node --check scripts/smoke-live.mjs
node --check scripts/smoke-judge.mjs
bash -n scripts/judge-up.sh
docker compose --env-file .env.judge.example -f infra/docker-compose.yml -f infra/docker-compose.judge.yml config >/tmp/campusbook-judge-compose.yaml
pnpm --filter api test
```

## 验证结果

执行时间：`2026-04-22 15:12 CST`

### API 回归结果

```text
# tests 25
# suites 7
# pass 25
# fail 0
```

其中 `COMP-005` 新增用例：

- `delayed expiration worker 会自动取消待支付订单`
- `同用户跨票种不能形成同活动双报名`
- `规则停用后立即失效、启用后立即生效`

### judge 路径轻量校验

```text
175 /tmp/campusbook-judge-compose.yaml
```

说明 judge compose 在 `.env.judge.example` 下可以成功展开，`judge-up.sh` 语法通过。

## 说明

- 本轮没有实际执行整套 `judge-up` 容器拉起，避免再次把当前环境压重
- 但 smoke 脚本的语法、judge compose 展开、以及 smoke 依赖的真实业务链路，都已经通过自动化测试和静态校验落证
- 若后续需要在独立演示机上做最终彩排，优先执行：
  - `bash scripts/judge-up.sh .env.judge.example`
  - `pnpm smoke:judge`

## 影响

- `pnpm test` 现在已经覆盖 Guardrail、支付对撞、规则 registry、安全头、业务级回归与库存恢复
- judge smoke 与 live smoke 都已从“活性检查”升级成“真实业务链路复现”
- `judge-up` 已具备重复执行后的稳定演示基线
