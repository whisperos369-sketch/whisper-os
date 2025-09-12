<#!
.SYNOPSIS
  Performs basic environment checks for required tools.
#>

Write-Host "=== Preflight Checks ==="

try { node --version } catch { Write-Warning "node not found" }
try { pnpm --version } catch { Write-Warning "pnpm not found" }
try { python --version } catch { Write-Warning "python not found" }
try { ffmpeg -version } catch { Write-Warning "ffmpeg not found" }
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    nvidia-smi
} elseif (Get-Command nvcc -ErrorAction SilentlyContinue) {
    nvcc --version
} else {
    Write-Warning "CUDA tools not found (nvidia-smi or nvcc)"
}
