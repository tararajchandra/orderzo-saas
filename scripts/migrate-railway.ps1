# Railway Database Migration Script
# This script will help you run the migration on Railway's database

Write-Host "🚀 Railway Database Migration Helper" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

Write-Host "To run the migration on Railway database, you have 2 options:`n" -ForegroundColor Yellow

Write-Host "📋 OPTION 1: Get Railway Database Connection String" -ForegroundColor Green
Write-Host "   1. Go to Railway Dashboard (https://railway.app/)" -ForegroundColor White
Write-Host "   2. Open your RuchiV2 project" -ForegroundColor White
Write-Host "   3. Click on Postgres service" -ForegroundColor White
Write-Host "   4. Click on 'Connect' tab" -ForegroundColor White
Write-Host "   5. Copy the 'Postgres Connection URL' (starts with postgresql://)" -ForegroundColor White
Write-Host "   6. Come back here and paste it when prompted`n" -ForegroundColor White

Write-Host "📋 OPTION 2: Install Railway CLI (Recommended)" -ForegroundColor Green
Write-Host "   Run: npm install -g @railway/cli" -ForegroundColor White
Write-Host "   Then: railway login" -ForegroundColor White
Write-Host "   Then run this script again`n" -ForegroundColor White

Write-Host "====================================`n" -ForegroundColor Cyan

# Check if Railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if ($railwayInstalled) {
    Write-Host "✅ Railway CLI is installed!" -ForegroundColor Green
    Write-Host "`nRunning migration on Railway database...`n" -ForegroundColor Cyan
    
    # Run the migration using Railway CLI
    railway run node migrate-customer-optional.js
    
}
else {
    Write-Host "⚠️  Railway CLI not found" -ForegroundColor Yellow
    Write-Host "`nDo you want to:" -ForegroundColor White
    Write-Host "  1. Install Railway CLI now (recommended)" -ForegroundColor White
    Write-Host "  2. Enter database connection string manually`n" -ForegroundColor White
    
    $choice = Read-Host "Enter your choice (1 or 2)"
    
    if ($choice -eq "1") {
        Write-Host "`nInstalling Railway CLI..." -ForegroundColor Cyan
        npm install -g @railway/cli
        
        Write-Host "`n✅ Railway CLI installed!" -ForegroundColor Green
        Write-Host "Now run: railway login" -ForegroundColor Yellow
        Write-Host "Then run this script again.`n" -ForegroundColor Yellow
        
    }
    elseif ($choice -eq "2") {
        Write-Host "`nPlease paste your Railway Postgres Connection URL:" -ForegroundColor Cyan
        Write-Host "(It should look like: postgresql://user:password@host:port/database)`n" -ForegroundColor Gray
        
        $connectionString = Read-Host "Connection URL"
        
        if ($connectionString) {
            Write-Host "`nRunning migration..." -ForegroundColor Cyan
            
            # Set the connection string as environment variable
            $env:DATABASE_URL = $connectionString
            
            # Create a temporary script that uses DATABASE_URL
            $tempScript = @"
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration on Railway database...\n');
        
        await client.query('ALTER TABLE orders ALTER COLUMN customer_name DROP NOT NULL');
        console.log('✅ customer_name is now nullable\n');
        
        await client.query('ALTER TABLE orders ALTER COLUMN customer_phone DROP NOT NULL');
        console.log('✅ customer_phone is now nullable\n');
        
        const result1 = await client.query("UPDATE orders SET customer_name = 'Walk-in Customer' WHERE customer_name IS NULL OR customer_name = ''");
        console.log('✅ Updated ' + result1.rowCount + ' rows for customer_name\n');
        
        const result2 = await client.query("UPDATE orders SET customer_phone = 'N/A' WHERE customer_phone IS NULL OR customer_phone = ''");
        console.log('✅ Updated ' + result2.rowCount + ' rows for customer_phone\n');
        
        console.log('🎉 Migration completed successfully on Railway database!\n');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
"@
            
            Set-Content -Path "temp-railway-migration.js" -Value $tempScript
            
            # Run the migration
            node temp-railway-migration.js
            
            # Clean up
            Remove-Item "temp-railway-migration.js" -ErrorAction SilentlyContinue
            
            Write-Host "`n✅ Done! The migration has been applied to Railway database." -ForegroundColor Green
            Write-Host "You can now test the salesperson ordering on your Railway app.`n" -ForegroundColor Green
        }
    }
}
