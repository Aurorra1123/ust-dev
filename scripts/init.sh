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
