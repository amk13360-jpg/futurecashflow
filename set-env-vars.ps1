param(
    [string]$resourceGroup = "futuremining",
    [string]$appName = "fmining"
)

Write-Host "🚀 Setting environment variables for Azure App Service..." -ForegroundColor Green

# Set environment variables one by one
$envVars = @{
    "NODE_ENV" = "production"
    "DB_HOST" = "dbfuture.mysql.database.azure.com"
    "DB_NAME" = "scf_platform"
    "DB_USER" = "Futuremining2025"
    "DB_PASSWORD" = "Mining@2025"
    "DB_PORT" = "3306"
    "WEBSITE_NODE_DEFAULT_VERSION" = "18-lts"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Yellow
    
    & az webapp config appsettings set --resource-group $resourceGroup --name $appName --settings "$key=$value"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully set $key" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set $key" -ForegroundColor Red
    }
}

Write-Host "🎯 Environment variables setup complete!" -ForegroundColor Green