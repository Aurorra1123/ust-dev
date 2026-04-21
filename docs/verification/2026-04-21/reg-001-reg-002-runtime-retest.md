# REG-001 / REG-002 本地真实复测记录

## 目标

- 复测“新增资源单元是否真的可用”。
- 审计并补齐管理端写操作反馈覆盖率。

## 运行环境

- 使用本地 HTTPS 站点：
  - `https://campusbook.top`
  - `https://api.campusbook.top`
- 本轮增量更新：
  - `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps api web`
  - `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web`
- 最终前端 bundle：
  - `assets/index-DEaL4bkf.js`

## REG-001 资源单元链路复测

### 实测步骤

1. 使用管理员账号登录本地 API，获取 access token。
2. 创建临时资源：
   - `code=reg001_res_1776772916`
3. 在该资源下创建临时资源单元：
   - `code=reg001_unit_1776772916`
4. 使用相同单元编码再次创建，验证错误路径。
5. 使用最新接口删除临时资源单元与临时资源，完成清理。

### 实测结果

- 创建资源成功，返回 `200`。
- 创建资源单元成功，返回体中 `units` 已包含新单元。
- 重复单元编码会返回：
  - HTTP `409`
  - `resource-unit-code-conflict`
- 清理测试数据成功：
  - 删除资源单元 `200`
  - 删除资源 `200`

### 结论

- “无法新增资源单元”当前不再是准确表述。
- 现阶段应将其从真实缺陷移出，保留为已验证通过事项。

## REG-002 写操作反馈覆盖率审计

### 审计范围

- 资源工作区
- 规则工作区
- 活动工作区
- 通知工作区
- 工单工作区

### 审计结论

- 资源、规则、通知、工单的大部分写操作原本已具备成功 / 失败反馈。
- 本轮发现两个真实缺口：
  - 活动状态切换存在 mutation，但缺少统一成功 / 失败反馈面板。
  - 多条危险操作缺少确认提示。

### 本轮补齐项

- 为活动工作区的状态切换补齐统一 `pending / success / error` 反馈。
- 为以下危险操作补齐确认提示：
  - 管理员取消预约
  - 资源停用
  - 规则停用
  - 活动关闭
  - 工单关闭

### 相关校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

### 结论

- “所有操作都没有提示”不成立。
- “不是所有操作都有统一反馈与确认”在复测开始时成立，但已在本轮补齐。
- `UTG-007` 当前可标记为通过。
