@echo off

echo Checking Azure CLI and Azure Developer CLI installation...

REM Check if Azure CLI is installed
where az >nul 2>nul
if %errorlevel% neq 0 (
    echo Azure CLI is not installed. Please install it first:
    echo Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    exit /b 1
)

REM Check if Azure Developer CLI is installed
where azd >nul 2>nul
if %errorlevel% neq 0 (
    echo Azure Developer CLI is not installed. Installing...
    powershell -ex AllSigned -c "Invoke-RestMethod 'https://aka.ms/install-azd.ps1' | Invoke-Expression"
) else (
    echo Azure Developer CLI is already installed.
)

echo Logging into Azure...
call az login

echo Setting up Azure Developer CLI environment...
call azd auth login

echo Initializing the deployment environment...
echo Please run the following commands to deploy:
echo 1. azd provision --preview   # Preview the resources that will be created
echo 2. azd provision             # Create the Azure resources
echo 3. azd deploy                # Deploy the application

echo.
echo After deployment, you can:
echo - azd down                   # Remove all Azure resources
echo - azd pipeline config        # Set up CI/CD pipeline
echo - azd monitor                # View application metrics and logs

pause