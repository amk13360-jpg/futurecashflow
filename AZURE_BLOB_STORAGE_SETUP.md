# Azure Blob Storage Setup for SCF Platform

## Step 1: Create Azure Storage Account

Run these commands in Azure CLI (or use Azure Portal):

```bash
# Set variables
RESOURCE_GROUP="your-resource-group"
STORAGE_ACCOUNT="scfplatformstorage"  # Must be globally unique, lowercase, 3-24 chars
LOCATION="southafricanorth"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true

# Create container for cession agreements
az storage container create \
  --name cession-agreements \
  --account-name $STORAGE_ACCOUNT \
  --public-access blob

# Get connection string
az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv
```

## Step 2: Add Environment Variables

Add these to your Azure App Service configuration:

```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=scfplatformstorage;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=cession-agreements
```

### Via Azure CLI:
```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name fm-asp-dev-san \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="YOUR_CONNECTION_STRING" \
    AZURE_STORAGE_CONTAINER_NAME="cession-agreements"
```

### Via Azure Portal:
1. Go to your App Service
2. Settings → Configuration → Application settings
3. Add new application settings:
   - `AZURE_STORAGE_CONNECTION_STRING`: Your storage connection string
   - `AZURE_STORAGE_CONTAINER_NAME`: `cession-agreements`

## Step 3: Deploy and Test

After adding the environment variables:
1. Restart the App Service
2. Have a supplier upload a new cession agreement
3. The file will now be stored in Azure Blob Storage permanently

## How It Works

| Environment | Storage Location |
|------------|------------------|
| **Production** (Azure) | Azure Blob Storage (`https://scfplatformstorage.blob.core.windows.net/cession-agreements/...`) |
| **Development** (Local) | Local filesystem (`/public/uploads/cession-agreements/...`) |

The code automatically detects if `AZURE_STORAGE_CONNECTION_STRING` is set and uses Blob Storage, otherwise falls back to local filesystem.

## Existing Files

Files that were uploaded before this fix are lost (they were on ephemeral storage). Suppliers will need to re-upload their cession agreements.

You may want to:
1. Reset the `cession_agreements` table status for affected suppliers
2. Notify suppliers to re-upload their documents

```sql
-- Reset cession agreements that have broken URLs
UPDATE cession_agreements 
SET status = 'pending', document_url = NULL 
WHERE document_url LIKE '/uploads/%';
```
