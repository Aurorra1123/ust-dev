# 代码质量重构第四阶段前端错误契约收口验证

## 变更目标

- 收口前端对错误对象的读取方式，停止页面直接把 `error.message` 当唯一协议来源，或在页面内各自猜测 `status / message`。
- 在不改后端现有异常格式的前提下，为前端提供稳定的 `message / status / code` 读取入口。

## 实施摘要

- 已增强 `apps/web/src/lib/http/errors.ts`：
  - `ApiError` 现在包含稳定 `code`
  - 新增 `isApiError`
  - 新增 `getErrorMessage`
  - 新增 `getErrorStatus`
  - 新增 `getErrorCode`
- 已把“后端当前多数以 slug message 表示机器码”的兼容策略收口到 `errors.ts`：
  - 若 payload 内已有 `code / errorCode`，前端直接读取
  - 若后端仍只返回机器可读的 message slug，前端只在 `errors.ts` 内将其推断为 `code`
  - 页面层不再自己判断 message 是否可当 code
- 已替换主要调用点：
  - 学生端登录、订单、活动、学术空间、体育、通知、工单页面
  - 后台总览、活动、通知、工单、资源、规则工作区
  - `MutationState` 默认错误展示已统一走 `getErrorMessage`
- 已把资源/规则删除等错误分支从 `switch (message)` 改成 `switch (code)`，避免业务页继续绑定字符串 message 细节

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-R0vzsOAW.js`

## 结论

- 第四阶段中“前端错误契约统一读取入口”的部分已落地，页面层对 `message/status/code` 的读取方式已经明显收口。
- 本轮没有改后端异常结构，只是在前端建立统一边界，符合“不为未知未来预埋大而全协议层”的既定原则。
