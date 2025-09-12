param()
Write-Host 'Creating virtual environment...'
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r api/requirements.txt
Write-Host 'Installing UI dependencies...'
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm install
} else {
  npm install
}
Write-Host 'Setup complete.'
