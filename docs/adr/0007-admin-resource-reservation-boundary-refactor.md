# 0007 后台与资源预约边界拆分基线

## 背景

当前仓库一级结构已经稳定，但二级边界出现以下问题：

- 管理端后台页面过大，工作区、数据请求、写操作和展示逻辑混在同一个页面组件内
- 前端 API 层把 HTTP 请求、认证刷新、业务接口和 session 副作用耦合在一起
- `resource` 模块中的服务同时承担读、写、规则管理、状态聚合和模型映射
- `reservation` 与 `orders` 模块重复实现预约共享规则

如果继续在现有结构上增量开发，后续会持续抬高阅读成本和回归风险。

## 决策

本仓库后续按以下方式收拢边界：

1. 保持一级结构不变，继续使用 `apps/web`、`apps/api`、`packages`、`docs`
2. 后端继续以 `modules/*` 为唯一主组织轴，不新增顶层 `domain/`
3. 管理端按工作区拆分页面职责：
   - 后台总入口只保留工作区切换和最小共享选中态
   - 工作区组件各自拥有自己的数据请求、写操作和表单状态
4. 前端 API 层拆为：
   - 通用 HTTP client
   - 按业务域划分的 API 模块
5. `resource` 模块拆为：
   - `read`
   - `write`
   - `status`
   - `mapper`
6. `reservation` 与 `orders` 共享的预约规则收拢到 `reservation/shared/reservation-policy.ts`

## 明确不采用的方案

本轮明确不采用以下方案：

- 新增 `apps/api/src/domain/` 顶层目录
- 为各模块统一引入 `repository` 层
- 再包一层 `facade` 把拆分后的 service 全部重新聚合
- 建立通用 `base service` / `base controller`

原因是这些方案会在当前规模下增加额外抽象成本，与“最小必要拆分”的目标相冲突。

## 影响

正向影响：

- 页面和服务职责更清楚
- 共享规则有单一事实来源
- 后续定位改动点和回归点更直接

需要注意的影响：

- 拆分初期文件数量会增加
- 若状态仍集中在后台总入口，拆文件本身并不能真正降低耦合
- 前端 HTTP client 与认证 API 的依赖方向需要谨慎处理，避免循环依赖

## 后续动作

1. 先将拆分蓝图写入 `docs/architecture/admin-resource-reservation-boundary-refactor.md`
2. 将本项工作写入 `docs/plans/feature-list.json`
3. 代码实施时按：
   - 前端 API
   - 后台页面
   - `resource` 模块
   - 预约共享规则
   的顺序推进
