#!/usr/bin/env bash
set -e

fail() {
  echo "[ERROR] $1" >&2
  exit 1
}

if [ ! -f "apps/api/app/main.py" ] || [ ! -f "README.md" ]; then
  fail "请在 EduForge 项目根目录运行本脚本。"
fi

echo "[INFO] 推荐 Conda 环境：cnsoftbei_a3_eduforge"

command -v uvicorn >/dev/null 2>&1 || fail "未找到 uvicorn，请先激活环境并安装依赖：cd apps/api && pip install -r requirements.txt && pip install -e ."

cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
