@echo off
REM Deploy SCF Platform to Azure
REM This script sets up the complete Azure infrastructure and deploys the application

echo 🚀 Starting Azure deployment for SCF Platform...

REM Check if Azure CLI is installed
az --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Azure CLI is required. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    exit /b 1
)

REM Check if azd is installed
azd version >nul 2>&1
if errorlevel 1 (
    echo ❌ Azure Developer CLI is required. Please install: https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd
    exit /b 1
)

REM Prompt for required parameters
set /p ENVIRONMENT_NAME="Enter Azure environment name (e.g., scf-prod): "
set /p LOCATION="Enter Azure location (e.g., eastus): "
set /p MYSQL_USERNAME="Enter MySQL admin username: "
set /p MYSQL_PASSWORD="Enter MySQL admin password: "
set /p JWT_SECRET="Enter JWT secret (or press Enter for auto-generated): "

REM Validate inputs
if "%ENVIRONMENT_NAME%"=="" goto :missing_params
if "%LOCATION%"=="" goto :missing_params
if "%MYSQL_USERNAME%"=="" goto :missing_params
if "%MYSQL_PASSWORD%"=="" goto :missing_params

REM Generate JWT secret if not provided
if "%JWT_SECRET%"=="" (
    for /f %%i in ('powershell -Command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))"') do set JWT_SECRET=%%i
    echo ✅ Generated JWT secret
)

echo 📝 Setting up Azure Developer CLI environment...

REM Initialize azd environment
azd env set AZURE_ENV_NAME "%ENVIRONMENT_NAME%"
azd env set AZURE_LOCATION "%LOCATION%"
azd env set MYSQL_ADMIN_USERNAME "%MYSQL_USERNAME%"
azd env set MYSQL_ADMIN_PASSWORD "%MYSQL_PASSWORD%"
azd env set JWT_SECRET "%JWT_SECRET%"

echo 🔍 Validating deployment...

REM Validate deployment
azd provision --preview

echo 🏗️  Provisioning Azure resources...

REM Deploy infrastructure
azd provision

echo 📦 Building and deploying application...

REM Deploy application
azd deploy

echo ✅ Deployment completed successfully!
echo 🌐 Your application should be available at the URL shown above
echo 📊 View your resources in the Azure portal

REM Show final status
azd show

goto :end

:missing_params
echo ❌ All parameters are required
exit /b 1

:end