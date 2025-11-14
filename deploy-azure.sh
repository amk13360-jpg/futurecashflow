#!/bin/bash

# Deploy SCF Platform to Azure
# This script sets up the complete Azure infrastructure and deploys the application

set -e

echo "🚀 Starting Azure deployment for SCF Platform..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is required. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if azd is installed
if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI is required. Please install: https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd"
    exit 1
fi

# Prompt for required parameters
read -p "Enter Azure environment name (e.g., scf-prod): " ENVIRONMENT_NAME
read -p "Enter Azure location (e.g., eastus): " LOCATION
read -s -p "Enter MySQL admin username: " MYSQL_USERNAME
echo
read -s -p "Enter MySQL admin password: " MYSQL_PASSWORD
echo
read -s -p "Enter JWT secret (or press Enter for auto-generated): " JWT_SECRET
echo

# Validate inputs
if [[ -z "$ENVIRONMENT_NAME" || -z "$LOCATION" || -z "$MYSQL_USERNAME" || -z "$MYSQL_PASSWORD" ]]; then
    echo "❌ All parameters are required"
    exit 1
fi

# Generate JWT secret if not provided
if [[ -z "$JWT_SECRET" ]]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated JWT secret"
fi

echo "📝 Setting up Azure Developer CLI environment..."

# Initialize azd environment
azd env set AZURE_ENV_NAME "$ENVIRONMENT_NAME"
azd env set AZURE_LOCATION "$LOCATION"
azd env set MYSQL_ADMIN_USERNAME "$MYSQL_USERNAME"
azd env set MYSQL_ADMIN_PASSWORD "$MYSQL_PASSWORD"
azd env set JWT_SECRET "$JWT_SECRET"

echo "🔍 Validating deployment..."

# Validate deployment
azd provision --preview

echo "🏗️  Provisioning Azure resources..."

# Deploy infrastructure
azd provision

echo "📦 Building and deploying application..."

# Deploy application
azd deploy

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at the URL shown above"
echo "📊 View your resources in the Azure portal"

# Show final status
azd show