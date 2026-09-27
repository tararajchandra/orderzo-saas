# Clean Build Script
# This removes Next.js cache and rebuilds the project

Write-Host "🧹 Cleaning Next.js Build Cache" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Remove .next directory
if (Test-Path ".next") {
    Write-Host "🗑️  Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Removed .next`n" -ForegroundColor Green
}

# Remove node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Write-Host "🗑️  Removing node_modules/.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✅ Removed cache`n" -ForegroundColor Green
}

Write-Host "🔨 Rebuilding project...`n" -ForegroundColor Cyan
npm run build

Write-Host "`n✅ Build complete!`n" -ForegroundColor Green
