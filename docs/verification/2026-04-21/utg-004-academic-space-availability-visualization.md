# UTG-004 学术空间可视化可用时间视图验证

## 变更目标

- 为学术空间预约补齐提交前的可用性可视化。
- 让用户在连续时间模型下先看占用和关闭区间，再决定开始与结束时间。

## 实施摘要

- 学术空间页已接入公共预约状态查询。
- 页面新增按“资源单元 × 连续时间轴”的可视化视图：
  - 关闭区间
  - 已占用区间
  - 当前进行中区间
  - 当前用户选择区间
- 表单输入与时间轴联动：
  - 若所选时间段超出当前视窗，可一键对齐时间视图
  - 若命中关闭区间或已有预约冲突，会在提交前直接提示
  - 可用性数据未加载完成或加载失败时，不允许直接提交预约

## 关键决策

- 学术空间采用连续时间轴，而不是复用体育页的离散槽位表。
- 该决策已沉淀为 ADR：
  - `docs/adr/0011-academic-space-availability-uses-continuous-timeline.md`

## 本地校验

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web build`
- `docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web`

## 运行时结果

- 本地 HTTPS 站点当前已切到新前端 bundle：
  - `assets/index-CKB0JMC-.js`
- 本地 `web` 容器已使用新镜像重建并启动。

## 结论

- 学术空间页已不再是“纯表单直提”模式。
- 用户当前可以先查看时间窗内的占用与关闭情况，再决定预约起止时间。
- 实现方式与学术空间现有连续时间预约模型保持一致。
