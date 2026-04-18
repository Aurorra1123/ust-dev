# OPS-001 Smoke Regression

日期：2026-04-18

## 目标

为当前已上线的 `campusbook.top / www / api` 补一套低负载、可重复执行的 smoke test，并把至少两条核心已通过流程固化成回归样本。

## 新增内容

- 脚本：`scripts/smoke-live.mjs`
- 根命令：
  - `pnpm test`
  - `pnpm smoke:live`
- CI 新增 `Test` 阶段，当前执行 `pnpm test`

## 回归样本

### 样本 1：用户侧最小主链路

1. 访问 `campusbook.top`
2. 调用 `api.campusbook.top/health`
3. 使用 demo 学生账号登录
4. 读取：
   - 学术空间资源列表
   - 活动列表
   - 我的订单列表

判定标准：

- 域名入口可达
- 登录成功
- 学生视角的核心只读页面都能拿到真实数据

### 样本 2：管理员侧最小主链路

1. 使用 demo 管理员账号登录
2. 读取：
   - 管理资源列表
   - 管理活动列表
   - 管理规则列表

判定标准：

- 管理员登录成功
- 管理端最小页面依赖的数据接口都可用

## 实际执行

执行命令：

```bash
pnpm test
pnpm smoke:live
```

实际结果：

```json
{
  "status": "ok",
  "checkedAt": "2026-04-18T10:21:53.676Z",
  "counts": {
    "academicResources": 1,
    "activities": 3,
    "orders": 6,
    "adminResources": 2,
    "adminActivities": 4,
    "adminRules": 3
  }
}
```

## 结论

- 当前线上域名入口和核心只读 API 均可用
- 用户端与管理端最小主链路已经具备可重复执行的 smoke 检查
- 后续可以在这份脚本基础上继续补更细的状态型业务回归
