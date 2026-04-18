# DOCS-001 Verification

## 范围

本次验证覆盖两部分：

- `DOCS-001`：将 `docs/reference/` 继续映射为正式产品、规则和领域模型入口
- 证书续期自动化：补充仓库内可重复执行的续期脚本和使用说明

## 新增或更新的正式入口

- `docs/architecture/product-baseline.md`
- `docs/architecture/domain-model-baseline.md`
- `docs/standards/business-rules-baseline.md`
- `docs/standards/reference-mapping.md`
- `docs/standards/https-deployment-playbook.md`
- `docs/reference/README_说明.md`
- `docs/README.md`
- `docs/architecture/README.md`

## 轻量验证

### 1. feature-list JSON 校验

执行：

```bash
python -m json.tool docs/plans/feature-list.json
```

预期：

- JSON 语法正确
- `DOCS-001` 已可标记为通过

### 2. 续期脚本语法校验

执行：

```bash
bash -n scripts/renew-https-certs.sh
```

预期：

- 脚本语法合法

### 3. diff 基础检查

执行：

```bash
git diff --check
```

预期：

- 无空白错误

## 当前证书状态

- 现网证书已存在于 `infra/nginx/.runtime/certbot/conf/live/campusbook.top/`
- 当前正式证书到期时间：`2026-07-17`

## 结果

- `reference` 已有明确归属与正式入口映射
- 新会话可优先从正式文档恢复产品、规则和领域模型上下文
- 仓库内已具备可重复执行的证书续期脚本与文档说明
