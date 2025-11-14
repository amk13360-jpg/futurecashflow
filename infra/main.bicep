targetScope = 'resourceGroup'

@minLength(1)
@description('Primary location for all resources')
param location string = resourceGroup().location

@minLength(1)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Prefix for all resource names')
param resourceNamePrefix string = 'scf'

// Optional parameters
@description('The SKU of the App Service Plan')
param appServiceSku string = 'F1' // Free tier, change to 'B1' or 'S1' for production

@description('MySQL server admin username')
param mysqlAdminUsername string = 'Futuremining2025'

@description('MySQL server admin password')
@secure()
param mysqlAdminPassword string

@description('MySQL database name')
param databaseName string = 'fmf_scf_platform'

@description('JWT secret for authentication')
@secure()
param jwtSecret string = newGuid()

// Variables
var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 
  azdEnvName: environmentName
  project: 'supply-chain-finance'
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${abbrs.webServerFarms}${resourceNamePrefix}-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: false
  }
}

// MySQL Flexible Server
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-06-30' = {
  name: '${abbrs.dBforMySQLServers}${resourceNamePrefix}-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminUsername
    administratorLoginPassword: mysqlAdminPassword
    storage: {
      storageSizeGB: 20
      iops: 360
      autoGrow: 'Enabled'
    }
    createMode: 'Default'
    version: '8.0.21'
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// MySQL Database
resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-06-30' = {
  parent: mysqlServer
  name: databaseName
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_unicode_ci'
  }
}

// MySQL Firewall Rules
resource mysqlFirewallRuleAzure 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-06-30' = {
  parent: mysqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Optional: Allow all IPs for development (remove for production)
resource mysqlFirewallRuleAll 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-06-30' = {
  parent: mysqlServer
  name: 'AllowAllIPs'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${abbrs.webSitesAppService}${resourceNamePrefix}-${resourceToken}'
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      nodeVersion: '18-lts'
      appCommandLine: 'npm run start'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'DB_HOST'
          value: mysqlServer.properties.fullyQualifiedDomainName
        }
        {
          name: 'DB_NAME'
          value: databaseName
        }
        {
          name: 'DB_USER'
          value: mysqlAdminUsername
        }
        {
          name: 'DB_PASSWORD'
          value: mysqlAdminPassword
        }
        {
          name: 'DB_PORT'
          value: '3306'
        }
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '18.17.0'
        }
      ]
    }
  }
}

// Outputs
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup().name

output SERVICE_WEB_NAME string = appService.name
output SERVICE_WEB_URI string = 'https://${appService.name}.azurewebsites.net'

output MYSQL_HOST string = mysqlServer.properties.fullyQualifiedDomainName
output MYSQL_DATABASE_NAME string = databaseName