# Skill Verification: harness-best-practice

## 目标

验证仓库内 skill `skills/harness-best-practice` 可被正常识别、可生成 docs harness 骨架，并默认避免覆盖既有文件。

## 验证命令

```bash
python3 /root/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/harness-best-practice
python3 -m py_compile skills/harness-best-practice/scripts/bootstrap_docs_harness.py
python3 skills/harness-best-practice/scripts/bootstrap_docs_harness.py --dry-run /tmp/harness-best-practice-smoke
python3 skills/harness-best-practice/scripts/bootstrap_docs_harness.py /tmp/harness-best-practice-smoke
python3 skills/harness-best-practice/scripts/bootstrap_docs_harness.py /tmp/harness-best-practice-smoke
```

## 结果摘要

- `quick_validate` 返回 `Skill is valid!`
- `py_compile` 通过，说明脚本可被当前环境中的 Python 3.6 正常解析
- dry-run 显示将创建 15 个文件，包括 `AGENTS.md` 和 `docs/` 执行层骨架
- 首次实际执行成功创建 15 个文件
- 第二次执行默认跳过已存在文件，共跳过 15 个文件，未发生覆盖

## 抽样检查

- `/tmp/harness-best-practice-smoke/docs/README.md` 中的 `{{PROJECT_NAME}}` 已替换为 `harness-best-practice-smoke`
- `/tmp/harness-best-practice-smoke/docs/progress/agent-progress.md` 中的 `{{TODAY}}` 已替换为 `2026-04-18`
- 生成结构包含：
  - `docs/plans/feature-list.json`
  - `docs/progress/agent-progress.md`
  - `docs/standards/`
  - `docs/adr/`
  - `docs/architecture/`
  - `docs/verification/`
  - `docs/exec-plan/`
  - `docs/reference/`

## 备注

- 临时验证仓库路径为 `/tmp/harness-best-practice-smoke`
- 本次验证未执行 `--force` 覆盖场景，保留默认安全策略即可满足当前 skill 目标
