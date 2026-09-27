# Pre-Push Checklist - Run this before git push

Write-Host "🔍 Checking Ruchi App for Coolify Deployment..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: Node modules
Write-Host "✓ Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✅ node_modules exists" -ForegroundColor Green
}
else {
    Write-Host "  ❌ node_modules missing - run: npm install" -ForegroundColor Red
    $allGood = $false
}

# Check 2: Required files
Write-Host ""
Write-Host "✓ Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "package-lock.json",
    "nixpacks.toml",
    ".dockerignore",
    ".gitignore",
    ".env.example",
    ".env.production.coolify",
    "COOLIFY_DEPLOYMENT_CHECKLIST.md",
    "database/schema.sql"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check 3: Git status
Write-Host ""
Write-Host "✓ Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus
}
else {
    Write-Host "  ✅ All changes committed" -ForegroundColor Green
}

# Check 4: Database migrations
Write-Host ""
Write-Host "✓ Checking database migrations..." -ForegroundColor Yellow
if (Test-Path "database/migrations") {
    $migrations = Get-ChildItem "database/migrations" -Filter "*.sql"
    Write-Host "  ✅ Found $($migrations.Count) migration files" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Migrations folder missing" -ForegroundColor Red
    $allGood = $false
}

# Check 5: Build test
Write-Host ""
Write-Host "✓ Testing build (this may take a minute)..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build successful" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Build failed - check errors above" -ForegroundColor Red
    $allGood = $false
}

# Check 6: Environment template
Write-Host ""
Write-Host "✓ Checking environment template..." -ForegroundColor Yellow
$envContent = Get-Content ".env.production.coolify" -Raw
if ($envContent -match "DATABASE_URL" -and $envContent -match "JWT_SECRET" -and $envContent -match "NEXT_PUBLIC_APP_URL") {
    Write-Host "  ✅ All required variables present" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Missing required environment variables" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to push to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. git add ." -ForegroundColor White
    Write-Host "2. git commit -m 'Prepare for Coolify deployment'" -ForegroundColor White
    Write-Host "3. git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "After pushing, follow: COOLIFY_DEPLOYMENT_CHECKLIST.md" -ForegroundColor Cyan
}
else {
    Write-Host "SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before pushing." -ForegroundColor Yellow
}
Write-Host "================================" -ForegroundColor Cyan
