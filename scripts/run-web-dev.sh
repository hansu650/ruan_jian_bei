#!/usr/bin/env bash
set -e

if [ ! -d "apps/web" ]; then
  echo "[ERROR] 请在 EduForge 项目根目录运行本脚本。" >&2
  exit 1
fi

cd apps/web

if [ ! -f "package.json" ]; then
  echo "[ERROR] apps/web/package.json was not found." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[ERROR] pnpm was not found. Run: corepack enable && corepack prepare pnpm@latest --activate" >&2
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[ERROR] Frontend dependencies are not installed. Run: cd apps/web && pnpm install" >&2
  exit 1
fi

pnpm dev
