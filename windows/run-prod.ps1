<#!
.SYNOPSIS
  Builds UI and runs API with two workers serving static files.
#>

pnpm build | Out-Host

$apiLog = "api.log"
$uiLog = "ui.log"

Start-Process -FilePath ".\\.venv\\Scripts\\python.exe" -ArgumentList "-m","uvicorn","api.main:app","--host","0.0.0.0","--port","8000","--workers","2" -RedirectStandardOutput $apiLog -RedirectStandardError $apiLog
Start-Process -FilePath "pnpm" -ArgumentList "dlx","serve","-s","dist","-l","5173" -RedirectStandardOutput $uiLog -RedirectStandardError $uiLog

Write-Host "Production servers started"
Get-Content $apiLog, $uiLog -Wait
