# UTG-008 登录页密码显隐切换验证

## 变更目标

- 为登录页密码输入框补齐显示 / 隐藏切换。
- 降低演示账号切换与课堂联调时的输错成本。

## 实施摘要

- 登录页密码输入框右侧已新增显隐切换按钮。
- 默认仍以 `password` 类型渲染，保持隐藏状态。
- 点击按钮后可在 `password` 与 `text` 两种显示方式之间切换。
- 按钮文案与 `aria-label` 已接入中英文切换。
- 按钮补充了 `aria-pressed`，便于表达当前开关状态。

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-CHrV8eKM.js`

## 结论

- 登录页密码框当前默认隐藏，符合原有安全预期。
- 用户已可明确切换显示或隐藏密码。
- 切换按钮具备中英文文案和可访问性标签，满足 `UTG-008` 验收条件。
