# Check Environment Variables

Write-Host "=== Checking Environment Variables ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host ".env file exists" -ForegroundColor Green
    
    # Read .env file
    $envContent = Get-Content ".env"
    $accessCodeSet = $false
    $secretKeySet = $false
    
    foreach ($line in $envContent) {
        if ($line -match "^ESIM_ACCESS_ACCESS_CODE=") {
            $value = $line -replace "ESIM_ACCESS_ACCESS_CODE=", ""
            $value = $value.Trim()
            if ($value -and $value.Length -gt 0 -and $value -notmatch "your-") {
                Write-Host "ESIM_ACCESS_ACCESS_CODE is set (length: $($value.Length) chars)" -ForegroundColor Green
                $accessCodeSet = $true
            } else {
                Write-Host "ESIM_ACCESS_ACCESS_CODE is not set or has placeholder" -ForegroundColor Red
            }
        }
        if ($line -match "^ESIM_ACCESS_SECRET_KEY=") {
            $value = $line -replace "ESIM_ACCESS_SECRET_KEY=", ""
            $value = $value.Trim()
            if ($value -and $value.Length -gt 0 -and $value -notmatch "your-") {
                Write-Host "ESIM_ACCESS_SECRET_KEY is set (length: $($value.Length) chars)" -ForegroundColor Green
                $secretKeySet = $true
            } else {
                Write-Host "ESIM_ACCESS_SECRET_KEY is not set or has placeholder" -ForegroundColor Red
            }
        }
    }
    
    if (-not $accessCodeSet) {
        Write-Host "WARNING: ESIM_ACCESS_ACCESS_CODE not found or invalid" -ForegroundColor Yellow
    }
    if (-not $secretKeySet) {
        Write-Host "WARNING: ESIM_ACCESS_SECRET_KEY not found or invalid" -ForegroundColor Yellow
    }
} else {
    Write-Host ".env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "IMPORTANT: Restart the backend server after adding credentials" -ForegroundColor Yellow
Write-Host ""
