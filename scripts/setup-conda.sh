#!/usr/bin/env bash
set -e

ENV_NAME="${1:-cnsoftbei_a3_eduforge}"
PYTHON_VERSION="${PYTHON_VERSION:-3.11}"

fail() {
  echo "[ERROR] $1" >&2
  exit 1
}

command -v conda >/dev/null 2>&1 || fail "未找到 conda，请先安装 Anaconda 或 Miniconda，并确认 conda 已加入 PATH。"

if [ ! -f "apps/api/pyproject.toml" ] || [ ! -f "scripts/check-env.py" ] || [ ! -f "README.md" ]; then
  fail "请在 EduForge 项目根目录运行本脚本。"
fi

echo "[INFO] 使用 Conda 环境：${ENV_NAME}"
echo "[INFO] Python 版本：${PYTHON_VERSION}"

if conda env list | awk '{print $1}' | grep -Fxq "${ENV_NAME}"; then
  echo "[INFO] 环境已存在，将复用：${ENV_NAME}"
else
  echo "[INFO] 环境不存在，开始创建：${ENV_NAME}"
  conda create -n "${ENV_NAME}" "python=${PYTHON_VERSION}" -y
fi

echo "[INFO] 升级 pip"
conda run -n "${ENV_NAME}" python -m pip install --upgrade pip

echo "[INFO] 安装后端运行依赖"
conda run -n "${ENV_NAME}" python -m pip install -r apps/api/requirements.txt

echo "[INFO] 安装后端开发依赖"
conda run -n "${ENV_NAME}" python -m pip install -r apps/api/requirements-dev.txt

echo "[INFO] 安装后端可编辑包"
conda run -n "${ENV_NAME}" python -m pip install -e apps/api

echo ""
echo "[OK] Conda 环境准备完成。"
echo "下一步："
echo "  conda activate ${ENV_NAME}"
echo "  python scripts/check-env.py"
