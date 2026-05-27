#!/usr/bin/env bash
set -e
ENV_NAME="${ENV_NAME:-cnsoftbei_a3_eduforge}"

fail() {
  echo "[ERROR] $1" >&2
  exit 1
}

run_step() {
  echo ""
  echo "[INFO] $1"
  shift
  "$@"
}

if [ ! -f "apps/api/pyproject.toml" ] || [ ! -f "apps/web/package.json" ]; then
  fail "Please run this script from the EduForge project root."
fi

command -v conda >/dev/null 2>&1 || fail "conda was not found. Please install Anaconda or Miniconda."

run_step "Backend pytest" bash -lc "cd apps/api && conda run -n ${ENV_NAME} pytest"
run_step "Backend ruff" bash -lc "cd apps/api && conda run -n ${ENV_NAME} ruff check ."
run_step "Backend mypy" bash -lc "cd apps/api && conda run -n ${ENV_NAME} mypy app tests"

if [ ! -d "apps/web/node_modules" ]; then
  fail "Frontend dependencies are not installed. Run: cd apps/web && pnpm install"
fi

run_step "Frontend lint" bash -lc "cd apps/web && pnpm lint"
run_step "Frontend typecheck" bash -lc "cd apps/web && pnpm typecheck"

echo ""
echo "[OK] Phase 2 checks passed."
