# Automated Batch Import Script
# This script imports all menu item batches to Railway automatically

Write-Host "🚀 Automated Menu Items Batch Import" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Configuration
$APP_URL = "https://ruchiv2-production.up.railway.app"
$BATCH_DIR = "menu_items_batches"
$TYPE = "menu_items"

# Check if batch directory exists
if (-not (Test-Path $BATCH_DIR)) {
    Write-Host "❌ Error: $BATCH_DIR directory not found!" -ForegroundColor Red
    Write-Host "Run: node scripts/split-menu-items.js first`n" -ForegroundColor Yellow
    exit 1
}

# Get all batch files
$batchFiles = Get-ChildItem -Path $BATCH_DIR -Filter "menu_items_batch_*.json" | Sort-Object Name

if ($batchFiles.Count -eq 0) {
    Write-Host "❌ No batch files found in $BATCH_DIR`n" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Found $($batchFiles.Count) batch files`n" -ForegroundColor Green

# Ask for confirmation
Write-Host "This will import all batches to: $APP_URL" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "`n❌ Cancelled`n" -ForegroundColor Red
    exit 0
}

Write-Host ""

# Import each batch
$totalImported = 0
$totalSkipped = 0
$failedBatches = @()

foreach ($file in $batchFiles) {
    $batchName = $file.Name
    Write-Host "📤 Importing: $batchName..." -ForegroundColor Cyan
    
    try {
        # Create form data
        $filePath = Join-Path $BATCH_DIR $file.Name
        $boundary = [System.Guid]::NewGuid().ToString()
        $fileContent = [System.IO.File]::ReadAllBytes($filePath)
        
        # Build multipart form data
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"type`"",
            "",
            $TYPE,
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$batchName`"",
            "Content-Type: application/json",
            "",
            [System.Text.Encoding]::UTF8.GetString($fileContent),
            "--$boundary--"
        )
        
        $body = $bodyLines -join "`r`n"
        
        # Make request
        $response = Invoke-RestMethod -Uri "$APP_URL/api/admin/data-management/import" `
            -Method Post `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $body `
            -TimeoutSec 120
        
        if ($response.success) {
            Write-Host "   ✅ Success: $($response.details.imported) imported, $($response.details.skipped) skipped" -ForegroundColor Green
            $totalImported += $response.details.imported
            $totalSkipped += $response.details.skipped
        }
        else {
            Write-Host "   ❌ Failed: $($response.error)" -ForegroundColor Red
            $failedBatches += $batchName
        }
        
        # Small delay between batches
        Start-Sleep -Seconds 2
        
    }
    catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failedBatches += $batchName
    }
}

# Summary
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Import Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "Total Imported: $totalImported" -ForegroundColor Green
Write-Host "Total Skipped:  $totalSkipped" -ForegroundColor Yellow

if ($failedBatches.Count -gt 0) {
    Write-Host "`nFailed Batches: $($failedBatches.Count)" -ForegroundColor Red
    foreach ($failed in $failedBatches) {
        Write-Host "  - $failed" -ForegroundColor Red
    }
}
else {
    Write-Host "`n🎉 All batches imported successfully!" -ForegroundColor Green
}

Write-Host ""
