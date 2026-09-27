# ============================================
# Run Database Migration
# ============================================
# Purpose: Execute the migration to make customer details optional
# ============================================

# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Error "DATABASE_URL not found in environment variables"
    exit 1
}

Write-Host "Running migration: 008_make_customer_details_optional.sql" -ForegroundColor Cyan

# Use Node.js with pg library to run the migration
$migrationScript = @"
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        const migrationPath = path.join(__dirname, 'database', 'migrations', '008_make_customer_details_optional.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
"@

# Save the script to a temporary file
$tempScript = "temp_migration.js"
Set-Content -Path $tempScript -Value $migrationScript

# Run the migration
try {
    node $tempScript
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration completed successfully!" -ForegroundColor Green
    }
    else {
        Write-Error "Migration failed with exit code $LASTEXITCODE"
    }
}
finally {
    # Clean up
    if (Test-Path $tempScript) {
        Remove-Item $tempScript
    }
}
