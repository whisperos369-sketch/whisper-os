<#!
.SYNOPSIS
  Stops common development/production processes.
#>

$ports = @(8000,8001,5173,4173)
foreach ($p in $ports) {
    Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $($_.OwningProcess) on port $p"
        } catch {}
    }
}

$names = @("uvicorn","node","pnpm","serve")
foreach ($n in $names) {
    Get-Process $n -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
}
