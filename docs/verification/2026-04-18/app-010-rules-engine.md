# APP-010 验证记录

日期：`2026-04-18`

## 验证范围

- 规则执行器 `RulesService / rule-engine`
- 管理员规则接口 `GET /admin/rules`
- 规则接入学术空间预约与体育设施预约
- 支持的规则类型：
  - `min_credit_score`
  - `max_duration_minutes`
  - `allowed_user_roles`

## 验证环境

- 先执行 `pnpm seed:demo`，写入 demo 规则与资源绑定
- 使用本机临时 API 进程：
  - `API_PORT=3001 pnpm --filter api exec ts-node --project tsconfig.json --transpile-only src/main.ts`
- 未起本地 worker，也未重建 compose 镜像
- PostgreSQL / Redis 仍复用当前 compose 常驻容器

## 静态校验

- `pnpm --filter api typecheck`
- `pnpm --filter api lint`

结果：均通过

## Seed 结果

新增 demo 规则：

- `rule_demo_academic_min_credit`
- `rule_demo_academic_max_duration`
- `rule_demo_sports_student_only`

绑定关系：

- `res_academic_demo`
  - `min_credit_score = 80`
  - `max_duration_minutes = 120`
- `res_sports_demo`
  - `allowed_user_roles = ["student"]`

用户基线：

- `demo@campusbook.top`：`creditScore = 100`
- `admin@campusbook.top`：`creditScore = 70`

## 验证步骤与结果

### 1. 健康检查回归通过

- `GET http://127.0.0.1:3001/health`
- 结果：`status=ok`，`postgres=up`，`redis=up`

### 2. 管理员可以读取规则配置表

- 接口：`GET /admin/rules`
- 结果：
  - 返回 3 条 demo 规则
  - 每条规则都带有解析后的 `expression`
  - 返回了资源绑定 `resourceIds`

### 3. 学生发起 60 分钟学术空间预约成功

- 接口：`POST /reservations/academic`
- 资源：`unit_academic_demo`
- 时间：`2026-04-25T01:00:00Z -> 2026-04-25T02:00:00Z`
- 结果：
  - 返回 `201`
  - 正常创建订单与学术预约

### 4. 学生发起 180 分钟学术空间预约被规则拦截

- 接口：`POST /reservations/academic`
- 时间：`2026-04-26T01:00:00Z -> 2026-04-26T04:00:00Z`
- 结果：
  - 返回 `400`
  - 错误码：`rule-max-duration-exceeded`

### 5. 管理员发起 60 分钟学术空间预约被信用分规则拦截

- 接口：`POST /reservations/academic`
- 时间：`2026-04-27T01:00:00Z -> 2026-04-27T02:00:00Z`
- 结果：
  - 返回 `403`
  - 错误码：`rule-min-credit-score-not-met`

### 6. 管理员发起体育设施预约被角色规则拦截

- 接口：`POST /reservations/sports`
- 资源：`unit_sports_demo_a`
- 槽位：`2026-04-28T10:00:00Z`
- 结果：
  - 返回 `403`
  - 错误码：`rule-user-role-not-allowed`

### 7. 测试清理

- 将成功创建的学术预约订单 `cmo42ayem00051rnw8hrma3uu` 取消
- 结果：
  - 订单状态变为 `CANCELLED`
  - 学术预约状态同步变为 `CANCELLED`

## 结论

- `APP-010` 已具备规则配置表 + 执行器的最小闭环
- 规则类型至少已覆盖：
  - 用户身份差异
  - 信用分额度
  - 预约时长限制
- 规则判断已从预约主流程中收口到统一规则模块，而不是继续散落在业务接口里
