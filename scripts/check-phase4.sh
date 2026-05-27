#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="cnsoftbei_a3_eduforge"

run_step() {
  local name="$1"
  local dir="$2"
  shift 2
  echo
  echo "[INFO] ${name}"
  (cd "${dir}" && "$@")
}

run_step "Backend pytest" "${ROOT_DIR}/apps/api" conda run -n "${ENV_NAME}" pytest
run_step "Backend ruff" "${ROOT_DIR}/apps/api" conda run -n "${ENV_NAME}" ruff check .
run_step "Backend mypy" "${ROOT_DIR}/apps/api" conda run -n "${ENV_NAME}" mypy app tests
run_step "Frontend lint" "${ROOT_DIR}/apps/web" pnpm lint
run_step "Frontend typecheck" "${ROOT_DIR}/apps/web" pnpm typecheck

echo
echo "[OK] Phase 4 checks passed."
