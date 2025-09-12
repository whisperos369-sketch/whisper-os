<#!
.SYNOPSIS
  Performs basic environment checks for required tools.
#>

Write-Host "=== Preflight Checks ==="

$missing = @()

function Check-Version {
  param(
    [string]$Command,
    [string]$Name
  )
  if (Get-Command $Command -ErrorAction SilentlyContinue) {
    try {
      $ver = & $Command --version
      Write-Host "$Name: $ver"
    } catch {
      Write-Warning "$Name found but failed to report version"
    }
  } else {
    Write-Warning "$Name not found"
    $script:missing += $Name
  }
}

Check-Version node "Node"
Check-Version pnpm "pnpm"
Check-Version python "Python"
Check-Version ffmpeg "ffmpeg"

if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
  nvidia-smi | Select-Object -First 1
} elseif (Get-Command nvcc -ErrorAction SilentlyContinue) {
  nvcc --version
} else {
  Write-Warning "CUDA tools not found (nvidia-smi or nvcc)"
  $missing += 'CUDA'
}

if ($missing.Count -gt 0) {
  Write-Error "Missing dependencies: $($missing -join ', ')"
  exit 1
} else {
  Write-Host "All dependencies present."
}
