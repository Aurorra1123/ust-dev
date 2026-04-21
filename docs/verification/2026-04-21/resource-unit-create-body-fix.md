# 资源单元创建请求体字段修复验证

## 问题现象

- 管理员在资源工作区新增资源单元时，接口返回 `property resourceId should not exist`。

## 原因定位

- 前端在调用 `POST /admin/resources/:id/units` 时，把 `resourceId` 同时放进了 URL 路径和请求体。
- 后端 `CreateResourceUnitDto` 不接受 `resourceId` 字段，且全局启用了 `whitelist: true` 与 `forbidNonWhitelisted: true`，因此会直接报错。

## 修复摘要

- 资源工作区创建资源单元的 mutation 已改为：
  - `resourceId` 只用于构造接口路径
  - 请求体只保留 `code`、`name`、`unitType`、`availabilityMode`、`capacity` 等 DTO 允许字段

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-BVQg3Kgp.js`

## 结论

- “新增资源单元”请求体与后端 DTO 已重新对齐。
- 该报错的直接原因已被移除，本次修复不改变接口协议，也不影响其他资源工作区写操作。
