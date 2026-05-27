$ErrorActionPreference = "Stop"

function Stop-WithMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "apps/api/app/main.py") -or -not (Test-Path "README.md")) {
    Stop-WithMessage "Please run this script from the EduForge project root."
}

Write-Host "[INFO] Recommended Conda environment: cnsoftbei_a3_eduforge"

if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "uvicorn was not found. Activate the environment and install dependencies first: cd apps/api; pip install -r requirements.txt; pip install -e ."
}

Set-Location "apps/api"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
