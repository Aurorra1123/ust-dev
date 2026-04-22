# QA-008 非支付前端提分收口

## 目标

在不继续追支付链路测试的前提下，优先补齐前端高收益提分项：

- 学生侧工单表单显式 `label`
- 路由级懒加载与统一页面加载态
- 保留 API / Docker 的已验证非测试改动

## 本轮实现

- `apps/web/src/ui/pages/service-requests-page.tsx`
  - 为工单标题、位置、问题说明补齐显式 `label`
  - 增加 `id`
  - 为问题说明补充 `aria-describedby`
  - 为三个字段补充 `required`
- `apps/web/src/routes.tsx`
  - 将以下页面改为路由级懒加载：
    - `spaces`
    - `sports`
    - `activities`
    - `orders`
    - `orders/:orderId`
    - `service-requests`
    - `admin`
- `apps/web/src/ui/route-loading-state.tsx`
  - 新增统一页面加载态，复用 `StatePanel`

## 验证命令

```bash
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter api typecheck
```

## 验证结果

执行时间：`2026-04-22`

结果摘要：

```text
web typecheck: pass
web build: pass
api typecheck: pass
```

构建输出关键结果：

```text
dist/assets/orders-page-*.js               2.68 kB
dist/assets/service-requests-page-*.js     4.63 kB
dist/assets/order-detail-page-*.js         5.95 kB
dist/assets/activities-page-*.js           7.54 kB
dist/assets/sports-page-*.js              17.02 kB
dist/assets/spaces-page-*.js              18.37 kB
dist/assets/admin-page-*.js               79.33 kB
dist/assets/index-*.js                   276.80 kB
```

## 结论

- 学生侧工单主表单已经不再依赖 placeholder 充当标签
- 学生端和管理员主路径已经拆成独立路由 chunk
- 本轮没有继续扰动支付相关测试文件
