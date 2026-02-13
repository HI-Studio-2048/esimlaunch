# API Testing Script for eSIM Launch Backend

Write-Host "=== Testing eSIM Launch API ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "   SUCCESS: Health check passed" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "   FAILED: Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Register Merchant
Write-Host "2. Testing Merchant Registration..." -ForegroundColor Yellow
$testEmail = "test$(Get-Random)@example.com"
$registerData = @{
    email = $testEmail
    password = "TestPassword123"
    name = "Test Merchant"
    serviceType = "ADVANCED"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "   SUCCESS: Registration successful" -ForegroundColor Green
    Write-Host "   Email: $testEmail" -ForegroundColor Gray
    $jwtToken = $response.data.token
    Write-Host "   JWT Token received" -ForegroundColor Gray
} catch {
    Write-Host "   FAILED: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing Merchant Login..." -ForegroundColor Yellow
$loginData = @{
    email = $testEmail
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "   SUCCESS: Login successful" -ForegroundColor Green
    $jwtToken = $response.data.token
} catch {
    Write-Host "   FAILED: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Get Current Merchant
Write-Host "4. Testing Get Current Merchant..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $jwtToken"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers $headers
    Write-Host "   SUCCESS: Get merchant info successful" -ForegroundColor Green
    Write-Host "   Merchant ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "   Service Type: $($response.data.serviceType)" -ForegroundColor Gray
} catch {
    Write-Host "   FAILED: Get merchant failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 5: Create API Key
Write-Host "5. Testing API Key Creation..." -ForegroundColor Yellow
$apiKeyData = @{
    name = "Test API Key"
    rateLimit = 100
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/api-keys" -Method POST -Body $apiKeyData -ContentType "application/json" -Headers $headers
    Write-Host "   SUCCESS: API key created successfully" -ForegroundColor Green
    $apiKey = $response.data.key
    Write-Host "   API Key Prefix: $($response.data.keyPrefix)" -ForegroundColor Gray
    Write-Host "   IMPORTANT: Save this API key - $apiKey" -ForegroundColor Yellow
} catch {
    Write-Host "   FAILED: API key creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 6: List API Keys
Write-Host "6. Testing List API Keys..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/api-keys" -Method GET -Headers $headers
    Write-Host "   SUCCESS: List API keys successful" -ForegroundColor Green
    Write-Host "   Found $($response.data.Count) API key(s)" -ForegroundColor Gray
} catch {
    Write-Host "   FAILED: List API keys failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Test API with API Key
Write-Host "7. Testing API Endpoint with API Key..." -ForegroundColor Yellow
$apiHeaders = @{
    "Authorization" = "Bearer $apiKey"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/packages?locationCode=JP&type=BASE" -Method GET -Headers $apiHeaders
    Write-Host "   SUCCESS: API endpoint test successful" -ForegroundColor Green
    if ($response.obj -and $response.obj.packageList) {
        Write-Host "   Found $($response.obj.packageList.Count) packages for Japan" -ForegroundColor Gray
    } else {
        Write-Host "   Response received (may need eSIM Access credentials)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   WARNING: API endpoint test failed (may need eSIM Access credentials): $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Test 8: Get Balance
Write-Host "8. Testing Balance Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/balance" -Method GET -Headers $apiHeaders
    Write-Host "   SUCCESS: Balance check successful" -ForegroundColor Green
    if ($response.obj -and $response.obj.balance) {
        $balance = [math]::Round($response.obj.balance / 10000, 2)
        Write-Host "   Account Balance: $balance USD" -ForegroundColor Gray
    }
} catch {
    Write-Host "   WARNING: Balance check failed (may need eSIM Access credentials): $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Test 9: Get Regions
Write-Host "9. Testing Regions Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/regions" -Method GET -Headers $apiHeaders
    Write-Host "   SUCCESS: Regions endpoint successful" -ForegroundColor Green
    if ($response.obj) {
        Write-Host "   Regions data received" -ForegroundColor Gray
    }
} catch {
    Write-Host "   WARNING: Regions check failed (may need eSIM Access credentials): $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Account Details:" -ForegroundColor Yellow
Write-Host "  Email: $testEmail" -ForegroundColor White
Write-Host "  Password: TestPassword123" -ForegroundColor White
Write-Host ""







