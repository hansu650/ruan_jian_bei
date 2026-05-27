param(
    [string]$EnvName = "cnsoftbei_a3_eduforge",
    [string]$PythonVersion = "3.11"
)

$ErrorActionPreference = "Stop"

function Stop-WithMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "conda was not found. Please install Anaconda or Miniconda and make sure conda is in PATH."
}

if (-not (Test-Path "apps/api/pyproject.toml") -or -not (Test-Path "scripts/check-env.py") -or -not (Test-Path "README.md")) {
    Stop-WithMessage "Please run this script from the EduForge project root."
}

Write-Host "[INFO] Conda environment: $EnvName"
Write-Host "[INFO] Python version: $PythonVersion"

$envList = conda env list --json | ConvertFrom-Json
$envExists = $false
foreach ($envPath in $envList.envs) {
    if ((Split-Path $envPath -Leaf) -eq $EnvName) {
        $envExists = $true
        break
    }
}

if ($envExists) {
    Write-Host "[INFO] Environment already exists. Reusing: $EnvName"
} else {
    Write-Host "[INFO] Environment does not exist. Creating: $EnvName"
    conda create -n $EnvName python=$PythonVersion -y
}

Write-Host "[INFO] Upgrading pip"
conda run -n $EnvName python -m pip install --upgrade pip

Write-Host "[INFO] Installing backend runtime dependencies"
conda run -n $EnvName python -m pip install -r apps/api/requirements.txt

Write-Host "[INFO] Installing backend development dependencies"
conda run -n $EnvName python -m pip install -r apps/api/requirements-dev.txt

Write-Host "[INFO] Installing backend package in editable mode"
conda run -n $EnvName python -m pip install -e apps/api

Write-Host ""
Write-Host "[OK] Conda environment setup completed." -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  conda activate $EnvName"
Write-Host "  python scripts/check-env.py"
