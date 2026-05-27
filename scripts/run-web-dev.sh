#!/usr/bin/env bash
set -e

if [ ! -d "apps/web" ]; then
  echo "[ERROR] 请在 EduForge 项目根目录运行本脚本。" >&2
  exit 1
fi

cd apps/web

if [ ! -f "package.json" ]; then
  echo "第一阶段尚未创建 Next.js 项目，请在第二阶段创建前端骨架。"
  exit 0
fi

pnpm dev
