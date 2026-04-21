# 代码质量重构第一阶段共享 helper 收口验证

## 变更目标

- 先收口已经明确重复的小逻辑，停止在大页面和工作区里继续扩散相同实现。
- 不在这一轮直接拆大页面，只先建立共享逻辑的单一 owner。

## 实施摘要

- 新增预约输入 helper：
  - `apps/web/src/ui/helpers/reservation-input.ts`
  - 学术页与体育页现共用 `parseCompanionEmails`
- 新增工单状态 helper：
  - `apps/web/src/ui/helpers/service-request-status.ts`
  - 学生端工单页、后台工单工作区与后台总览共用同一套 `label / tone / options`
- 新增首页服务卡片配置：
  - `apps/web/src/ui/helpers/home-service-cards.ts`
  - 首页学生态与访客态都改为读取稳定 key + 显式中英文文案
- 已删除页面内重复实现：
  - `spaces-page.tsx` 与 `sports-page.tsx` 底部不再各自保留邮箱解析函数
  - `service-requests-page.tsx` 不再自带一份工单状态字典
  - `home-page.tsx` 不再依赖中文标题值分支推导英文

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## 构建结果

- 本地 `web` 构建通过，最新产物为：
  - `dist/assets/index-DStL5_0I.js`

## 结论

- 第一阶段“共享小逻辑收口”已落地，重复实现和文案驱动分支已明显减少。
- 本轮改动没有改变业务行为或接口协议，只调整了共享逻辑归口方式，符合既定代码质量基线。
