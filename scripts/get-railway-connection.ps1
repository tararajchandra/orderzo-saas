# Get Railway Database Connection String
# This script helps you find the actual database URL

Write-Host "`n🔍 Looking for Railway Database Connection String...`n" -ForegroundColor Cyan

Write-Host "In Railway Dashboard, follow these steps:" -ForegroundColor Yellow
Write-Host "=========================================`n" -ForegroundColor Yellow

Write-Host "1. Click on your Postgres service" -ForegroundColor White
Write-Host "2. Click on 'Variables' tab" -ForegroundColor White
Write-Host "3. Look for these variables and copy their VALUES (not the variable names):`n" -ForegroundColor White

Write-Host "   PGHOST = ?" -ForegroundColor Cyan
Write-Host "   PGPORT = ?" -ForegroundColor Cyan
Write-Host "   PGDATABASE = ?" -ForegroundColor Cyan
Write-Host "   PGUSER = ?" -ForegroundColor Cyan
Write-Host "   PGPASSWORD = ?" -ForegroundColor Cyan

Write-Host "`n4. Or look for 'DATABASE_URL' variable - it should have the full connection string`n" -ForegroundColor White

Write-Host "=========================================`n" -ForegroundColor Yellow

Write-Host "Once you have the values, paste them here:`n" -ForegroundColor Green

$host = Read-Host "PGHOST (e.g., containers-us-west-123.railway.app)"
$port = Read-Host "PGPORT (usually 5432)"
$database = Read-Host "PGDATABASE (usually 'railway')"
$user = Read-Host "PGUSER (usually 'postgres')"
$password = Read-Host "PGPASSWORD (the password value)" -AsSecureString

# Convert secure string to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Build connection string
$connectionString = "postgresql://${user}:${plainPassword}@${host}:${port}/${database}"

Write-Host "`n✅ Connection string created!" -ForegroundColor Green
Write-Host "`nRunning migration on Railway database...`n" -ForegroundColor Cyan

# Set environment variable
$env:DATABASE_URL = $connectionString

# Run the migration
node migrate-customer-optional.js

Write-Host "`n✅ Migration completed!" -ForegroundColor Green
Write-Host "You can now test the salesperson ordering on your Railway app.`n" -ForegroundColor Green
