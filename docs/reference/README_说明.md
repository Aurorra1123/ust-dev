# 智约校园六份文档重建版

本目录包含以下 6 份文档：

1. 01_需求说明.md
2. 02_规则说明.md
3. 03_系统架构图.md
4. 04_用户流程图.md
5. 05_订单状态机图.md
6. 06_ER图_数据库关系图.md

## 拆分原则
- 需求说明：只讲做什么
- 规则说明：只讲系统判定规则
- 系统架构图：只讲模块关系
- 用户流程图：只讲用户路径
- 订单状态机图：只讲订单状态迁移
- ER图/数据库关系图：只讲数据实体关系

## 当前维护约定

- 本目录属于输入材料层，默认不作为当前实现状态的主维护入口
- 日常开发优先阅读：
  - `docs/architecture/product-baseline.md`
  - `docs/standards/business-rules-baseline.md`
  - `docs/architecture/domain-model-baseline.md`
  - `docs/standards/reference-mapping.md`
- 只有当原始题面理解、拆分方式或重建材料本身需要修正时，才回改本目录
