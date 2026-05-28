$ErrorActionPreference = "Stop"
$EnvName = "cnsoftbei_a3_eduforge"

function Stop-WithMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )
    Write-Host ""
    Write-Host "[INFO] $Name"
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            Stop-WithMessage "$Name failed with exit code $LASTEXITCODE."
        }
    } catch {
        Stop-WithMessage "$Name failed."
    }
}

if (-not (Test-Path "apps/api/pyproject.toml") -or -not (Test-Path "apps/web/package.json")) {
    Stop-WithMessage "Please run this script from the EduForge project root."
}

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "conda was not found. Please install Anaconda or Miniconda."
}

Invoke-Step "Backend pytest" {
    Push-Location "apps/api"
    try { conda run -n $EnvName pytest } finally { Pop-Location }
}

Invoke-Step "Backend ruff" {
    Push-Location "apps/api"
    try { conda run -n $EnvName ruff check . } finally { Pop-Location }
}

Invoke-Step "Backend mypy" {
    Push-Location "apps/api"
    try { conda run -n $EnvName mypy app tests } finally { Pop-Location }
}

if (-not (Test-Path "apps/web/node_modules")) {
    Stop-WithMessage "Frontend dependencies are not installed. Run: cd apps/web; pnpm install"
}

Invoke-Step "Frontend lint" {
    Push-Location "apps/web"
    try { pnpm lint } finally { Pop-Location }
}

Invoke-Step "Frontend typecheck" {
    Push-Location "apps/web"
    try { pnpm typecheck } finally { Pop-Location }
}

Write-Host ""
Write-Host "[OK] Phase 10.1 checks passed. No real Spark HTTP API call was made." -ForegroundColor Green
