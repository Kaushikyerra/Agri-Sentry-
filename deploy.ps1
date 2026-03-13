# Kisan Sahayak Deployment Script

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   🚀 DEPLOYING KISAN SAHAYAK" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Step 1: Build the project
Write-Host "Step 1: Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!`n" -ForegroundColor Green

# Step 2: Deploy to Vercel
Write-Host "Step 2: Deploying to Vercel..." -ForegroundColor Cyan
Write-Host "Please follow the prompts to login and configure deployment.`n" -ForegroundColor Yellow

vercel --prod

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Your app is now live! 🎉" -ForegroundColor Cyan
Write-Host "Check the URL above to access your deployed app.`n" -ForegroundColor White
