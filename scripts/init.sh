#!/usr/bin/env bash
set -euo pipefail

echo "Workspace: $(pwd)"

if [ ! -d ".git" ]; then
  echo "Git repository not initialized."
  exit 1
fi

echo
echo "Recent commits:"
git log --oneline -10 || true

echo
echo "Progress log:"
if [ -f "docs/progress/agent-progress.md" ]; then
  sed -n '1,160p' docs/progress/agent-progress.md
fi

echo
echo "Feature list:"
if [ -f "docs/plans/feature-list.json" ]; then
  sed -n '1,220p' docs/plans/feature-list.json
fi

echo
echo "Regression reminder:"
echo "- 先抽样回归 1-2 个已标记通过的核心功能。"
echo "- 如果回归失败，先撤回通过状态并修复，再开发新功能。"

echo
echo "Verification evidence:"
if [ -d "docs/verification" ]; then
  find docs/verification -maxdepth 2 -type f | sort | tail -n 20
else
  echo "docs/verification not initialized."
fi
