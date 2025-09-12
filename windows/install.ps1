<#!
.SYNOPSIS
  Installs dependencies for development.
#>

# Install pnpm if not present
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm..."
    npm install -g pnpm | Out-Host
}

# Node dependencies
if (-not (Test-Path node_modules)) {
    Write-Host "Installing Node packages..."
    pnpm install | Out-Host
}

# Create virtual environment
if (-not (Test-Path .venv)) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

$venvPy = ".\.venv\Scripts\python.exe"
& $venvPy -m pip install --upgrade pip | Out-Host
& $venvPy -m pip install -r constraints.txt | Out-Host

# verify ffmpeg
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    $ff = (& ffmpeg -version | Select-Object -First 1)
    Write-Host $ff
} else {
    Write-Warning "ffmpeg not found. Please install it and add to PATH"
}

# write .env.example if missing
if (-not (Test-Path .env.example)) {
@"
GEMINI_API_KEY=REPLACE_ME
"@ | Out-File -Encoding UTF8 .env.example
    Write-Host "Created .env.example"
}
