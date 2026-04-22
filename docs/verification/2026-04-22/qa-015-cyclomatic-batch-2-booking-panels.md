# QA-015 Cyclomatic Batch 2 Booking Panels

## 范围

本轮完成圈复杂度治理第二批，聚焦学生侧预约面板：

- `apps/web/src/ui/pages/spaces/spaces-booking-panel.tsx`
- `apps/web/src/ui/pages/sports/sports-booking-panel.tsx`

## 主要拆分

- 新增共享组件：
  - `apps/web/src/ui/pages/booking/companion-emails-field.tsx`
- 学术预约面板拆分：
  - `space-time-range-fields.tsx`
  - `space-validation-panel.tsx`
  - `space-legend-card.tsx`
  - `occupied-periods-card.tsx`
  - `resource-closures-card.tsx`
- 体育预约面板拆分：
  - `sports-booking-mode-switch.tsx`
  - `sports-target-select.tsx`
  - `grouped-booking-notice.tsx`
  - `selected-slots-card.tsx`
  - `sports-legend-card.tsx`

## 影响

- 主面板现在只保留状态编排、禁用条件和提交逻辑
- 表单语义、键盘辅助说明、状态说明和同行人输入逻辑保持不变
- 本轮没有修改预约接口、时段选择算法或冲突判断

## 验证

已执行：

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
```

结果：

- `lint` 通过
- `typecheck` 通过
- `build` 通过
- 学术预约页和体育预约页构建产物正常输出
