param()

$ErrorActionPreference = 'Stop'

# Ensure Python launcher is available
if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    Write-Error 'Python is not installed or not found in PATH. Please install Python 3.11.'
    exit 1
}

$venvPath = Join-Path $PSScriptRoot '.venv'
$pythonExe = Join-Path $venvPath 'Scripts/python.exe'

if (-not (Test-Path $venvPath)) {
    Write-Host 'Creating virtual environment...'
    try {
        py -m venv $venvPath
    } catch {
        Write-Error "Failed to create virtual environment: $_"
        exit 1
    }
}

if (-not (Test-Path $pythonExe)) {
    Write-Error "Virtual environment not found at $pythonExe"
    exit 1
}

Write-Host 'Installing Python dependencies...'
& $pythonExe -m pip install -r (Join-Path $PSScriptRoot '..\\api\\requirements.txt')
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Dependency installation failed.'
    exit $LASTEXITCODE
}

Write-Host 'Installation complete.'
