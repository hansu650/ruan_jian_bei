$ErrorActionPreference = "Stop"

if (-not (Test-Path "apps/web")) {
    Write-Host "[ERROR] Please run this script from the EduForge project root." -ForegroundColor Red
    exit 1
}

Set-Location "apps/web"

if (-not (Test-Path "package.json")) {
    Write-Host "The Next.js app is not created in phase 1. Please create the frontend scaffold in phase 2."
    exit 0
}

pnpm dev
