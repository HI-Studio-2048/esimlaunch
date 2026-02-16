# Test eSIM Access Integration

Write-Host "=== Testing eSIM Access Integration ===" -ForegroundColor Cyan
Write-Host ""

# First, we need to create a test merchant and API key
Write-Host "Setting up test account..." -ForegroundColor Yellow
$testEmail = "test$(Get-Random)@example.com"
$registerData = @{
    email = $testEmail
    password = "TestPassword123"
    name = "Test Merchant"
    serviceType = "ADVANCED"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    $jwtToken = $response.data.token
    Write-Host "   Test account created: $testEmail" -ForegroundColor Green
} catch {
    Write-Host "   Failed to create test account: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create API key
$headers = @{
    "Authorization" = "Bearer $jwtToken"
}
$apiKeyData = @{
    name = "Test API Key"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/api-keys" -Method POST -Body $apiKeyData -ContentType "application/json" -Headers $headers
    $apiKey = $response.data.key
    Write-Host "   API key created" -ForegroundColor Green
} catch {
    Write-Host "   Failed to create API key: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$apiHeaders = @{
    "Authorization" = "Bearer $apiKey"
}

Write-Host ""
Write-Host "Testing eSIM Access API Endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Get Balance
Write-Host "1. Testing Balance Query..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/balance" -Method GET -Headers $apiHeaders
    if ($response.success) {
        if ($response.obj -and $response.obj.balance) {
            $balance = [math]::Round($response.obj.balance / 10000, 2)
            Write-Host "   SUCCESS: Account Balance = `$$balance USD" -ForegroundColor Green
        } else {
            Write-Host "   SUCCESS: Balance endpoint working (no balance data)" -ForegroundColor Green
        }
    } else {
        Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Get Packages (Japan)
Write-Host "2. Testing Get Packages (Japan)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/packages?locationCode=JP&type=BASE" -Method GET -Headers $apiHeaders
    if ($response.success) {
        if ($response.obj -and $response.obj.packageList) {
            Write-Host "   SUCCESS: Found $($response.obj.packageList.Count) packages for Japan" -ForegroundColor Green
            if ($response.obj.packageList.Count -gt 0) {
                $firstPackage = $response.obj.packageList[0]
                Write-Host "   Sample package: $($firstPackage.name)" -ForegroundColor Gray
                Write-Host "   Price: `$$([math]::Round($firstPackage.price / 10000, 2))" -ForegroundColor Gray
            }
        } else {
            Write-Host "   SUCCESS: Packages endpoint working (no packages returned)" -ForegroundColor Green
        }
    } else {
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Get Regions
Write-Host "3. Testing Get Regions..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/regions" -Method GET -Headers $apiHeaders
    if ($response.success) {
        if ($response.obj) {
            Write-Host "   SUCCESS: Regions endpoint working" -ForegroundColor Green
            Write-Host "   Regions data received" -ForegroundColor Gray
        } else {
            Write-Host "   SUCCESS: Regions endpoint working (no regions data)" -ForegroundColor Green
        }
    } else {
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Get Packages (All)
Write-Host "4. Testing Get All Packages..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/packages?type=BASE" -Method GET -Headers $apiHeaders
    if ($response.success) {
        if ($response.obj -and $response.obj.packageList) {
            Write-Host "   SUCCESS: Found $($response.obj.packageList.Count) total packages" -ForegroundColor Green
        } else {
            Write-Host "   SUCCESS: Packages endpoint working" -ForegroundColor Green
        }
    } else {
        Write-Host "   Error Code: $($response.errorCode)" -ForegroundColor Yellow
        Write-Host "   Error Message: $($response.errorMessage)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error Code: $($errorDetails.errorCode)" -ForegroundColor Red
        Write-Host "   Error Message: $($errorDetails.errorMessage)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== Integration Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests show SUCCESS, your eSIM Access integration is working!" -ForegroundColor Green
Write-Host ""








