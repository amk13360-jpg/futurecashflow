#!/bin/bash

echo "Checking Azure CLI and Azure Developer CLI installation..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first:"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if Azure Developer CLI is installed
if ! command -v azd &> /dev/null; then
    echo "Azure Developer CLI is not installed. Installing..."
    curl -fsSL https://aka.ms/install-azd.sh | bash
else
    echo "Azure Developer CLI is already installed."
fi

echo "Logging into Azure..."
az login

echo "Setting up Azure Developer CLI environment..."
azd auth login

echo "Initializing the deployment environment..."
echo "Please run the following commands to deploy:"
echo "1. azd provision --preview   # Preview the resources that will be created"
echo "2. azd provision             # Create the Azure resources"
echo "3. azd deploy                # Deploy the application"

echo ""
echo "After deployment, you can:"
echo "- azd down                   # Remove all Azure resources"
echo "- azd pipeline config        # Set up CI/CD pipeline"
echo "- azd monitor                # View application metrics and logs"