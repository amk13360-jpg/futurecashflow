// Parameters
@description('Name of the environment (prod, dev, staging)')
param environmentName string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('MySQL server admin username')
param mysqlAdminUsername string = 'Futuremining2025'

@description('MySQL server admin password')
@secure()
param mysqlAdminPassword string

@description('MySQL database name')
param databaseName string = 'fmf_scf_platform'

// Variables
var appServicePlanName = 'asp-scf-platform-${environmentName}'
var appServiceName = 'app-scf-platform-${environmentName}'
var mysqlServerName = 'mysql-scf-platform-${environmentName}-${uniqueString(resourceGroup().id)}'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// MySQL Server
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-06-30' = {
  name: mysqlServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminUsername
    administratorLoginPassword: mysqlAdminPassword
    version: '8.0.21'
    storage: {
      storageSizeGB: 20
      iops: 360
      autoGrow: 'Enabled'
    }
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
  name: databaseName
  parent: mysqlServer
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_unicode_ci'
  }
}

// MySQL Firewall Rule to allow Azure services
resource mysqlFirewallRule 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-06-30' = {
  name: 'AllowAzureServices'
  parent: mysqlServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      alwaysOn: true
      ftpsState: 'FtpsOnly'
      minTlsVersion: '1.2'
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
          value: uniqueString(resourceGroup().id, environmentName)
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
output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.name}.azurewebsites.net'
output mysqlServerName string = mysqlServer.name
output mysqlHost string = mysqlServer.properties.fullyQualifiedDomainName
output databaseName string = databaseName