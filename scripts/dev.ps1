param()
if (Test-Path logs) { Remove-Item logs -Recurse -Force }
$api = Start-Process -FilePath python -ArgumentList '-m uvicorn api.app.main:app --port 8080 --reload' -PassThru
try {
  npm run dev
} finally {
  $api | Stop-Process
}
