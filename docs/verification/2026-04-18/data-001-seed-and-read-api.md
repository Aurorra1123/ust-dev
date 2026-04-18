# DATA-001 验证记录

日期：`2026-04-18`

## 回归样本

- `GET /health` 经 `api.campusbook.top` 返回 `status=ok`
- `POST /auth/login` 对演示学生账号返回 `200`

## 验证范围

- `pnpm seed:demo` 可重复执行，不依赖手工 SQL
- 资源与活动公共列表/详情接口能返回真实数据
- 学生不能调用管理员写接口
- 管理员可以维护资源与活动基础数据

## 验证结果

1. 连续两次执行 `pnpm seed:demo` 均成功，输出固定的 demo 资源、活动和用户标识
2. `GET /resources` 返回 `200`，包含 `1` 个学术空间资源与 `1` 个体育设施资源
3. `GET /resources/res_sports_demo` 返回 `200`，详情中包含 `2` 个资源单元和 `1` 个组合资源
4. `GET /activities` 返回 `200`，seed 后可见已发布活动
5. `GET /activities/activity_demo_open_day` 返回 `200`，详情中包含 `2` 个票种
6. 学生调用 `PATCH /admin/activities/activity_demo_workshop_draft` 返回 `403 forbidden-role`
7. 管理员调用 `POST /admin/resources/res_academic_demo/units` 返回 `201`，学术空间资源单元数从 `1` 增至 `2`
8. 管理员调用 `PATCH /admin/activities/activity_demo_workshop_draft` 返回 `200`，活动标题更新为 `Design Sprint Workshop Updated`，状态改为 `published`
9. 管理员更新后再次请求 `GET /activities`，公共活动列表数量变为 `2`

## 结论

- `DATA-001` 已满足当前验收口径
- 前端后续接入时，可直接基于 `GET /resources`、`GET /resources/:id`、`GET /activities`、`GET /activities/:id`
- 管理端最小维护入口已经存在，后续 `APP-011` 只需补前端页面与调用链路
