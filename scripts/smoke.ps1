$body = @{prompt='test beat'; durationSec=3; model='musicgen-small'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:8000/api/music/generate' -Method Post -Body $body -ContentType 'application/json'
Write-Host "Raw:" $response.raw
Write-Host "MP3:" $response.mp3
Write-Host "Report:" $response.report
if (!(Test-Path $response.raw) -or !(Test-Path $response.mp3) -or !(Test-Path $response.report)) {
    throw 'Artifacts missing'
}
Write-Host 'Smoke test passed.'
