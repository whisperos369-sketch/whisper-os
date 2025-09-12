<#!
.SYNOPSIS
  Starts API (uvicorn) and UI dev server, tails logs.
#>

$apiLog = "api-dev.log"
$uiLog = "ui-dev.log"

Start-Process -FilePath ".\\.venv\\Scripts\\python.exe" `
  -ArgumentList "-m","uvicorn","api.main:app","--reload" `
  -RedirectStandardOutput $apiLog -RedirectStandardError $apiLog
Start-Process -FilePath "pnpm" -ArgumentList "dev" `
  -RedirectStandardOutput $uiLog -RedirectStandardError $uiLog

Write-Host "Servers starting..."
Get-Content $apiLog, $uiLog -Wait
