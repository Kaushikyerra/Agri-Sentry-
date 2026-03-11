Write-Host "🚀 Starting KrishiAI Backend..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will run on: http://0.0.0.0:8000" -ForegroundColor Cyan
Write-Host "Swagger Docs: http://10.22.129.76:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the backend" -ForegroundColor Yellow
Write-Host ""

python api.py

Write-Host ""
Write-Host "Backend stopped" -ForegroundColor Red
