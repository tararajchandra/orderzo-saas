# Deployment Preparation Script for Ruchi Restaurant App (Windows)
# This script helps prepare your app for deployment

Write-Host "🚀 Ruchi Restaurant - Deployment Preparation" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-Not (Test-Path .git)) {
    Write-Host "⚠️  Git repository not initialized" -ForegroundColor Yellow
    Write-Host "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ruchi Restaurant App"
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository found" -ForegroundColor Green
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes" -ForegroundColor Yellow
    Write-Host "Committing changes..."
    git add .
    $date = Get-Date -Format "yyyy-MM-dd"
    git commit -m "Pre-deployment commit - $date"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Check if .env.production exists
if (-Not (Test-Path .env.production)) {
    Write-Host "⚠️  .env.production not found" -ForegroundColor Yellow
    Write-Host "Creating from template..."
    Copy-Item .env.production.example .env.production
    Write-Host "⚠️  Please edit .env.production with your production values" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.production found" -ForegroundColor Green
}

# Test build
Write-Host ""
Write-Host "🔨 Testing production build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed - please fix errors before deploying" -ForegroundColor Red
    exit 1
}

# Check for common issues
Write-Host ""
Write-Host "🔍 Checking for common issues..." -ForegroundColor Cyan

# Check package.json
$packageJson = Get-Content package.json -Raw
if ($packageJson -match '"build":\s*"next build"') {
    Write-Host "✅ Build script configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Build script not found in package.json" -ForegroundColor Yellow
}

# Check for node version
Write-Host "Node version: $(node -v)"
Write-Host "NPM version: $(npm -v)"

Write-Host ""
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Push code to GitHub: git push origin main"
Write-Host "2. Sign up for hosting (Vercel recommended)"
Write-Host "3. Set up PostgreSQL database (Neon recommended)"
Write-Host "4. Configure environment variables"
Write-Host "5. Deploy!"
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow
