# PowerShell script to setup Deep Context & Meeting Prep feature
# This script creates Stripe prices and Supabase storage bucket

param(
    [Parameter(Mandatory=$true)]
    [string]$StripeSecretKey,
    
    [Parameter(Mandatory=$true)]
    [string]$SupabaseServiceRoleKey
)

$ErrorActionPreference = "Stop"

$SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg"
$SUPABASE_URL = "https://$SUPABASE_PROJECT_ID.supabase.co"

Write-Host "`n🔍 Step 1: Creating Stripe Prices...`n" -ForegroundColor Cyan

# Create Stripe products and prices
try {
    # Check for existing products
    $headers = @{
        "Authorization" = "Bearer $StripeSecretKey"
        "Content-Type" = "application/x-www-form-urlencoded"
    }
    
    $productsResponse = Invoke-RestMethod -Uri "https://api.stripe.com/v1/products?limit=100" -Method GET -Headers $headers
    $existingProducts = $productsResponse.data
    
    # Find or create Deep Context product
    $deepContextProduct = $existingProducts | Where-Object { $_.name -eq "Deep Context Upgrade" }
    if (-not $deepContextProduct) {
        Write-Host "➕ Creating Deep Context product..." -ForegroundColor Yellow
        $body = @{
            name = "Deep Context Upgrade"
            description = "Connect your company context for personalized insights and enhanced meeting prep materials"
        } | ConvertTo-Json
        
        $deepContextProduct = Invoke-RestMethod -Uri "https://api.stripe.com/v1/products" -Method POST -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "✅ Created Deep Context product: $($deepContextProduct.id)" -ForegroundColor Green
    } else {
        Write-Host "✅ Deep Context product already exists: $($deepContextProduct.id)" -ForegroundColor Green
    }
    
    # Find or create Bundle product
    $bundleProduct = $existingProducts | Where-Object { $_.name -eq "Full Diagnostic + Deep Context Bundle" }
    if (-not $bundleProduct) {
        Write-Host "➕ Creating Bundle product..." -ForegroundColor Yellow
        $body = @{
            name = "Full Diagnostic + Deep Context Bundle"
            description = "Get the complete diagnostic plus deep context integration (Save `$10)"
        } | ConvertTo-Json
        
        $bundleProduct = Invoke-RestMethod -Uri "https://api.stripe.com/v1/products" -Method POST -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "✅ Created Bundle product: $($bundleProduct.id)" -ForegroundColor Green
    } else {
        Write-Host "✅ Bundle product already exists: $($bundleProduct.id)" -ForegroundColor Green
    }
    
    # Check for existing prices
    $pricesResponse = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices?limit=100" -Method GET -Headers $headers
    $existingPrices = $pricesResponse.data
    
    # Find or create Deep Context price
    $deepContextPrice = $existingPrices | Where-Object { $_.product -eq $deepContextProduct.id -and $_.active -eq $true }
    if (-not $deepContextPrice) {
        Write-Host "➕ Creating Deep Context price (`$29)..." -ForegroundColor Yellow
        $body = @{
            product = $deepContextProduct.id
            unit_amount = 2900
            currency = "usd"
            "metadata[upgrade_type]" = "deep_context"
        }
        
        $deepContextPrice = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices" -Method POST -Headers $headers -Body $body
        Write-Host "✅ Created Deep Context price: $($deepContextPrice.id)" -ForegroundColor Green
    } else {
        Write-Host "✅ Deep Context price already exists: $($deepContextPrice.id)" -ForegroundColor Green
    }
    
    # Find or create Bundle price
    $bundlePrice = $existingPrices | Where-Object { $_.product -eq $bundleProduct.id -and $_.active -eq $true }
    if (-not $bundlePrice) {
        Write-Host "➕ Creating Bundle price (`$69)..." -ForegroundColor Yellow
        $body = @{
            product = $bundleProduct.id
            unit_amount = 6900
            currency = "usd"
            "metadata[upgrade_type]" = "bundle"
        }
        
        $bundlePrice = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices" -Method POST -Headers $headers -Body $body
        Write-Host "✅ Created Bundle price: $($bundlePrice.id)" -ForegroundColor Green
    } else {
        Write-Host "✅ Bundle price already exists: $($bundlePrice.id)" -ForegroundColor Green
    }
    
    Write-Host "`n📋 Stripe Prices Summary:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Deep Context Price ID: $($deepContextPrice.id)" -ForegroundColor White
    Write-Host "Bundle Price ID: $($bundlePrice.id)" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    # Update price IDs in code
    Write-Host "🔍 Step 3: Updating Price IDs in code...`n" -ForegroundColor Cyan
    $paymentFile = "supabase/functions/create-diagnostic-payment/index.ts"
    $content = Get-Content $paymentFile -Raw
    $content = $content -replace 'const DEEP_CONTEXT_PRICE_ID = ".*";', "const DEEP_CONTEXT_PRICE_ID = `"$($deepContextPrice.id)`";"
    $content = $content -replace 'const BUNDLE_PRICE_ID = ".*";', "const BUNDLE_PRICE_ID = `"$($bundlePrice.id)`";"
    Set-Content -Path $paymentFile -Value $content -NoNewline
    Write-Host "✅ Updated price IDs in create-diagnostic-payment/index.ts" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error creating Stripe prices: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 Step 2: Creating Supabase Storage Bucket...`n" -ForegroundColor Cyan

# Create storage bucket using Supabase REST API
try {
    $supabaseHeaders = @{
        "apikey" = $SupabaseServiceRoleKey
        "Authorization" = "Bearer $SupabaseServiceRoleKey"
        "Content-Type" = "application/json"
    }
    
    # Check if bucket exists
    $bucketsResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/bucket" -Method GET -Headers $supabaseHeaders -ErrorAction SilentlyContinue
    
    $bucketExists = $bucketsResponse | Where-Object { $_.name -eq "documents" }
    
    if ($bucketExists) {
        Write-Host "✅ Storage bucket 'documents' already exists" -ForegroundColor Green
    } else {
        Write-Host "➕ Creating storage bucket 'documents'..." -ForegroundColor Yellow
        $bucketBody = @{
            id = "documents"
            name = "documents"
            public = $false
            file_size_limit = 52428800
            allowed_mime_types = @("application/pdf")
        } | ConvertTo-Json
        
        $bucketResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/bucket" -Method POST -Headers $supabaseHeaders -Body $bucketBody
        Write-Host "✅ Created storage bucket 'documents'" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error creating storage bucket: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   You may need to create it manually in the Supabase Dashboard" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run the storage policies SQL from SETUP_INSTRUCTIONS.md (section 2, Step 2)"
Write-Host "2. Verify the price IDs were updated correctly in the code"
Write-Host "3. Test the payment flow`n"
