# SCF Platform Deployment Guide

This guide will help you deploy the SCF Platform to Azure App Service with Azure Database for MySQL.

## Prerequisites

1. **Azure Subscription**: Active Azure subscription
2. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Azure Developer CLI**: [Install Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)

## Quick Start

### Option 1: Automated Setup (Recommended)

**For Windows:**
```bash
.\deploy\setup-azure.bat
```

**For macOS/Linux:**
```bash
chmod +x deploy/setup-azure.sh
./deploy/setup-azure.sh
```

### Option 2: Manual Setup

1. **Login to Azure:**
   ```bash
   az login
   azd auth login
   ```

2. **Initialize the project:**
   ```bash
   azd init
   ```

3. **Preview the deployment:**
   ```bash
   azd provision --preview
   ```

4. **Create Azure resources:**
   ```bash
   azd provision
   ```

5. **Deploy the application:**
   ```bash
   azd deploy
   ```

## What Gets Deployed

The deployment creates the following Azure resources:

- **Resource Group**: Contains all resources
- **App Service Plan**: Hosts the Next.js application
- **App Service**: Runs the SCF Platform web application
- **Azure Database for MySQL Flexible Server**: Database for the application
- **Application Insights**: Monitoring and logging

## Environment Configuration

During deployment, you'll be prompted to set:

- **Environment name**: Unique identifier for your deployment
- **Azure region**: Where to deploy (e.g., East US, West Europe)
- **Database credentials**: Admin username and password for MySQL

## Database Setup

After deployment, you need to set up the database schema:

1. Connect to your MySQL server using the connection details from Azure portal
2. Run the SQL scripts in order:
   ```sql
   -- Run scripts/01-create-database-schema.sql
   -- Run scripts/02-seed-initial-data.sql
   -- Run scripts/03-update-schema-for-ap-data.sql
   ```

## Application Configuration

The following environment variables are automatically configured:

- `DB_HOST`: MySQL server hostname
- `DB_NAME`: Database name (fmf_scf_platform)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_PORT`: Database port (3306)
- `JWT_SECRET`: Auto-generated secret for JWT tokens

## Monitoring and Logs

After deployment, you can monitor your application:

```bash
# View application metrics and logs
azd monitor

# Stream application logs
az webapp log tail --name <app-name> --resource-group <resource-group>
```

## Updating the Application

To deploy updates:

```bash
azd deploy
```

## Scaling

To scale the application:

```bash
# Scale up (more powerful instances)
az appservice plan update --name <plan-name> --resource-group <resource-group> --sku P1V2

# Scale out (more instances)
az webapp update --name <app-name> --resource-group <resource-group> --instance-count 2
```

## Cleanup

To remove all Azure resources:

```bash
azd down
```

## Troubleshooting

### Common Issues

1. **Build failures**: Check application logs in Azure portal
2. **Database connection**: Verify connection string and firewall rules
3. **Environment variables**: Check App Service configuration settings

### Getting Help

- View deployment logs: `azd monitor`
- Check App Service logs: Azure portal → App Service → Log stream
- MySQL connection: Azure portal → MySQL server → Connection security

## Security Considerations

- Database credentials are stored securely in Azure Key Vault
- App Service uses managed identity where possible
- Database access is restricted to Azure services
- SSL/TLS is enforced for all connections

## Next Steps

1. Configure custom domain and SSL certificate
2. Set up CI/CD pipeline: `azd pipeline config`
3. Configure backup and disaster recovery
4. Set up monitoring alerts