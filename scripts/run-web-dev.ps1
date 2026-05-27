$ErrorActionPreference = "Stop"

if (-not (Test-Path "apps/web")) {
    Write-Host "[ERROR] Please run this script from the EduForge project root." -ForegroundColor Red
    exit 1
}

Set-Location "apps/web"

if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] apps/web/package.json was not found." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] pnpm was not found. Run: corepack enable; corepack prepare pnpm@latest --activate" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[ERROR] Frontend dependencies are not installed. Run: cd apps/web; pnpm install" -ForegroundColor Red
    exit 1
}

pnpm dev
