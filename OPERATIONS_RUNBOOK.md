# SCF Platform Operations & Runbook

## Supply Chain Finance Platform - Operations Manual

**Version:** 1.0  
**Last Updated:** December 2025  
**Classification:** Internal - Operations Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Infrastructure Overview](#2-infrastructure-overview)
3. [Daily Operations](#3-daily-operations)
4. [Monitoring & Alerting](#4-monitoring--alerting)
5. [Incident Response](#5-incident-response)
6. [Runbook Procedures](#6-runbook-procedures)
7. [Backup & Recovery](#7-backup--recovery)
8. [Scaling Procedures](#8-scaling-procedures)
9. [Maintenance Windows](#9-maintenance-windows)
10. [Contact & Escalation](#10-contact--escalation)

---

## 1. Overview

### 1.1 Document Purpose

This Operations & Runbook document provides:
- Day-to-day operational procedures
- Incident response guidelines
- Step-by-step runbook for common tasks
- Escalation procedures
- Disaster recovery processes

### 1.2 Target Audience

- DevOps Engineers
- System Administrators
- On-Call Engineers
- Platform Support Team

### 1.3 System Summary

| Component | Technology | Location |
|-----------|------------|----------|
| Application | Next.js 15 (Node.js 20) | Azure App Service |
| Database | MySQL 8.0 | Azure Database for MySQL Flexible Server |
| Email Service | Azure Communication Services | South Africa North |
| File Storage | Azure Blob Storage | South Africa North |
| DNS/CDN | Azure Front Door (optional) | Global |

---

## 2. Infrastructure Overview

### 2.1 Architecture Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │           AZURE CLOUD               │
                                    │      (South Africa North)           │
┌──────────────┐                    │                                     │
│              │                    │  ┌─────────────────────────────┐   │
│   Users      │◄──────────────────►│  │   Azure App Service         │   │
│  (Browser)   │      HTTPS         │  │   fm-asp-dev-san            │   │
│              │                    │  │   (Linux, Node.js 20)       │   │
└──────────────┘                    │  └──────────────┬──────────────┘   │
                                    │                 │                   │
                                    │                 │                   │
                                    │  ┌──────────────▼──────────────┐   │
                                    │  │   Azure MySQL Flexible      │   │
                                    │  │   futurefinancecashflow     │   │
                                    │  │   (SSL/TLS 1.2)             │   │
                                    │  └─────────────────────────────┘   │
                                    │                                     │
                                    │  ┌─────────────────────────────┐   │
                                    │  │   Azure Blob Storage        │   │
                                    │  │   scfplatformstorage        │   │
                                    │  │   (cession-agreements)      │   │
                                    │  └─────────────────────────────┘   │
                                    │                                     │
                                    │  ┌─────────────────────────────┐   │
                                    │  │   Azure Communication Svc   │   │
                                    │  │   fm-acs-dev-san            │   │
                                    │  │   (Email Service)           │   │
                                    │  └─────────────────────────────┘   │
                                    │                                     │
                                    └─────────────────────────────────────┘
```

### 2.2 Resource Details

#### App Service

| Property | Value |
|----------|-------|
| Name | `fm-asp-dev-san` |
| Resource Group | `fm-rg-dev-san` |
| Region | South Africa North |
| Plan | Basic B1 (or higher) |
| Runtime | Node.js 20 LTS |
| OS | Linux |
| URL | `https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net` |

#### MySQL Database

| Property | Value |
|----------|-------|
| Server Name | `futurefinancecashflow.mysql.database.azure.com` |
| Version | MySQL 8.0 |
| Database Name | `futurefinance_db` |
| SKU | Burstable B1ms (or higher) |
| Storage | 20 GB (auto-grow enabled) |
| Backup Retention | 7 days |
| SSL Mode | Required (TLS 1.2) |

#### Blob Storage

| Property | Value |
|----------|-------|
| Account Name | `scfplatformstorage` |
| Container | `cession-agreements` |
| Access Level | Private (authenticated access) |
| Replication | LRS (Locally Redundant) |

#### Communication Services

| Property | Value |
|----------|-------|
| Name | `fm-acs-dev-san` |
| Email Domain | Configured sender domain |
| Sender | `noreply@yourdomain.com` |

### 2.3 Environment Variables

```bash
# Database
DATABASE_HOST=futurefinancecashflow.mysql.database.azure.com
DATABASE_PORT=3306
DATABASE_USER=scfadmin
DATABASE_PASSWORD=********
DATABASE_NAME=futurefinance_db

# Authentication
JWT_SECRET=********

# Azure Communication Services
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://fm-acs-dev-san...

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_STORAGE_CONTAINER_NAME=cession-agreements

# Application
NEXT_PUBLIC_APP_URL=https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net
NODE_ENV=production
```

---

## 3. Daily Operations

### 3.1 Daily Checklist

| Time | Task | Owner | Status |
|------|------|-------|--------|
| 08:00 | Check application health | On-call | ☐ |
| 08:00 | Review overnight alerts | On-call | ☐ |
| 08:30 | Check database connections | On-call | ☐ |
| 09:00 | Review pending supplier applications | Admin | ☐ |
| 09:00 | Review pending cession agreements | Admin | ☐ |
| 12:00 | Check email delivery status | On-call | ☐ |
| 17:00 | End of day health check | On-call | ☐ |
| 17:00 | Handover to after-hours support | On-call | ☐ |

### 3.2 Weekly Checklist

| Day | Task | Owner |
|-----|------|-------|
| Monday | Review weekly metrics | Platform Lead |
| Monday | Check backup status | DevOps |
| Wednesday | Security scan review | Security Team |
| Friday | Performance review | DevOps |
| Friday | Capacity planning check | Platform Lead |

### 3.3 Monthly Checklist

| Task | Owner | Due Date |
|------|-------|----------|
| SSL certificate expiry check | DevOps | 1st |
| Database maintenance window | DBA | 1st Sunday |
| Security patch review | Security | 15th |
| Disaster recovery test | DevOps | Last Friday |
| Access review (user audit) | Admin | Last Friday |
| Cost review & optimization | Finance | 25th |

### 3.4 Health Check Endpoints

#### Application Health

```bash
# Check if application is running
curl -I https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net

# Expected: HTTP/2 200
```

#### Database Connectivity

```bash
# Connect to MySQL (from allowed IP)
mysql -h futurefinancecashflow.mysql.database.azure.com \
      -u scfadmin -p \
      --ssl-mode=REQUIRED \
      -e "SELECT 1;"
```

### 3.5 Key Metrics to Monitor

| Metric | Normal Range | Warning | Critical |
|--------|--------------|---------|----------|
| Response Time | < 500ms | > 1s | > 3s |
| Error Rate | < 1% | > 2% | > 5% |
| CPU Usage | < 60% | > 75% | > 90% |
| Memory Usage | < 70% | > 80% | > 95% |
| DB Connections | < 50 | > 75 | > 90 |
| Email Success Rate | > 98% | < 95% | < 90% |

---

## 4. Monitoring & Alerting

### 4.1 Azure Monitor Configuration

#### App Service Metrics

| Metric | Aggregation | Alert Threshold |
|--------|-------------|-----------------|
| Http5xx | Sum | > 10 in 5 min |
| Http4xx | Sum | > 50 in 5 min |
| ResponseTime | Average | > 2000ms |
| CpuPercentage | Average | > 80% for 5 min |
| MemoryPercentage | Average | > 85% for 5 min |

#### Database Metrics

| Metric | Aggregation | Alert Threshold |
|--------|-------------|-----------------|
| cpu_percent | Average | > 80% for 10 min |
| memory_percent | Average | > 85% for 10 min |
| storage_percent | Average | > 80% |
| active_connections | Max | > 80 |
| failed_connections | Sum | > 5 in 5 min |

### 4.2 Log Locations

#### Application Logs

```bash
# Azure Portal: App Service > Monitoring > Log stream

# Or via Azure CLI:
az webapp log tail --name fm-asp-dev-san --resource-group fm-rg-dev-san
```

#### Database Logs

```bash
# Azure Portal: MySQL Flexible Server > Monitoring > Server logs

# Slow query log location (if enabled)
# Azure Portal: MySQL > Server parameters > slow_query_log = ON
```

### 4.3 Log Categories

| Log Prefix | Description | Severity |
|------------|-------------|----------|
| `[AUTH]` | Authentication events | Info |
| `[AUTH-ERROR]` | Failed auth attempts | Warning |
| `[EMAIL]` | Email operations | Info |
| `[EMAIL-ERROR]` | Email failures | Error |
| `[DB]` | Database operations | Debug |
| `[DB-ERROR]` | Database errors | Error |
| `[UPLOAD]` | File uploads | Info |
| `[PAYMENT]` | Payment processing | Info |
| `[AUDIT]` | Audit trail entries | Info |

### 4.4 Alert Notification Channels

| Channel | Recipients | Priority |
|---------|-----------|----------|
| Email | ops-team@company.com | All |
| SMS | On-call phone | Critical only |
| Microsoft Teams | #scf-alerts | Warning + Critical |
| PagerDuty | On-call rotation | Critical only |

---

## 5. Incident Response

### 5.1 Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| SEV1 | Critical | Complete service outage | 15 min | Site down, data breach |
| SEV2 | High | Major feature unavailable | 30 min | Login broken, payments failing |
| SEV3 | Medium | Minor feature issue | 2 hours | Report not loading, slow performance |
| SEV4 | Low | Cosmetic/minor | 1 business day | UI bug, typo |

### 5.2 Incident Response Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT RESPONSE WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DETECT                                                                   │
│     └─► Alert received OR user report                                       │
│                                                                              │
│  2. TRIAGE (5 min)                                                          │
│     └─► Assess severity, assign owner                                       │
│                                                                              │
│  3. COMMUNICATE                                                              │
│     └─► Notify stakeholders based on severity                               │
│                                                                              │
│  4. INVESTIGATE                                                              │
│     └─► Check logs, metrics, recent changes                                 │
│                                                                              │
│  5. MITIGATE                                                                 │
│     └─► Apply fix or workaround                                             │
│                                                                              │
│  6. RESOLVE                                                                  │
│     └─► Confirm service restored                                            │
│                                                                              │
│  7. POST-MORTEM (within 48h)                                                │
│     └─► Document root cause, action items                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Communication Templates

#### Initial Incident Notification

```
INCIDENT: [SEV#] - [Brief Description]
TIME: [Discovery Time]
IMPACT: [What's affected]
STATUS: Investigating
NEXT UPDATE: [Time]
OWNER: [Name]
```

#### Status Update

```
INCIDENT UPDATE: [Title]
STATUS: [Investigating/Mitigating/Resolved]
CURRENT STATE: [Description]
ACTIONS TAKEN: [List]
NEXT STEPS: [List]
NEXT UPDATE: [Time]
```

#### Resolution Notification

```
INCIDENT RESOLVED: [Title]
DURATION: [Start] to [End]
ROOT CAUSE: [Brief description]
RESOLUTION: [What was done]
POST-MORTEM: [Scheduled for date/time]
```

### 5.4 Escalation Matrix

| Severity | 0-15 min | 15-30 min | 30-60 min | 60+ min |
|----------|----------|-----------|-----------|---------|
| SEV1 | On-call Engineer | Team Lead | Engineering Manager | CTO |
| SEV2 | On-call Engineer | Team Lead | Engineering Manager | - |
| SEV3 | On-call Engineer | Team Lead | - | - |
| SEV4 | Assigned Engineer | - | - | - |

---

## 6. Runbook Procedures

### 6.1 Application Restart

**When to use:** Application unresponsive, high memory usage, stuck processes

```bash
# Via Azure Portal
# App Service > Overview > Restart

# Via Azure CLI
az webapp restart --name fm-asp-dev-san --resource-group fm-rg-dev-san

# Verify restart
az webapp show --name fm-asp-dev-san --resource-group fm-rg-dev-san --query state
```

**Expected outcome:** Application restarts within 2-3 minutes

**Rollback:** N/A (restart is non-destructive)

---

### 6.2 Deploy New Version

**When to use:** Deploying new code from CI/CD or hotfix

#### Via Azure DevOps Pipeline (Recommended)

```yaml
# Trigger pipeline via:
# 1. Push to master branch
# 2. Manual trigger in Azure DevOps
```

#### Via Azure CLI (Hotfix)

```bash
# Build the application
npm run build

# Zip the deployment package
zip -r deploy.zip .next package.json node_modules public

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group fm-rg-dev-san \
  --name fm-asp-dev-san \
  --src deploy.zip
```

**Verification Steps:**

1. Check deployment status in Azure Portal
2. Verify application health endpoint
3. Test critical user flows (login, dashboard)
4. Monitor error rates for 15 minutes

**Rollback:**

```bash
# List deployment slots or previous deployments
az webapp deployment list --name fm-asp-dev-san --resource-group fm-rg-dev-san

# Rollback to previous deployment
az webapp deployment slot swap \
  --resource-group fm-rg-dev-san \
  --name fm-asp-dev-san \
  --slot staging \
  --target-slot production
```

---

### 6.3 Database Connection Issues

**Symptoms:** 
- "ECONNREFUSED" errors
- "Too many connections" errors
- Slow database queries

**Diagnostic Steps:**

```bash
# 1. Check MySQL server status
az mysql flexible-server show \
  --name futurefinancecashflow \
  --resource-group fm-rg-dev-san \
  --query "state"

# 2. Check connection count
mysql -h futurefinancecashflow.mysql.database.azure.com -u scfadmin -p \
  -e "SHOW STATUS LIKE 'Threads_connected';"

# 3. Check for blocking queries
mysql -e "SHOW PROCESSLIST;"

# 4. Check slow query log
mysql -e "SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;"
```

**Resolution Steps:**

```bash
# Kill long-running queries (if needed)
mysql -e "KILL <process_id>;"

# Restart application to reset connection pool
az webapp restart --name fm-asp-dev-san --resource-group fm-rg-dev-san

# If server is down, restart MySQL (Azure Portal)
# MySQL Flexible Server > Overview > Restart
```

---

### 6.4 Email Delivery Failures

**Symptoms:**
- Users not receiving OTP emails
- Suppliers not receiving welcome/approval emails
- `[EMAIL-ERROR]` in logs

**Diagnostic Steps:**

```bash
# 1. Check Azure Communication Services status
# Azure Portal > Communication Services > fm-acs-dev-san > Overview

# 2. Check email logs in application
# Look for [EMAIL-ERROR] entries

# 3. Verify sender domain configuration
# Azure Portal > Communication Services > Domains
```

**Resolution Steps:**

1. **Check email quota:** Ensure daily sending limit not exceeded
2. **Verify domain:** Confirm DNS records (SPF, DKIM) are correct
3. **Test email delivery:**

```bash
# Send test email via Azure Portal
# Communication Services > Try Email > Send test
```

4. **Check recipient spam filters:** Ask users to check spam/junk folders

**Common Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Emails going to spam | Missing SPF/DKIM | Configure DNS records |
| Rate limited | Too many emails | Upgrade tier or reduce frequency |
| Invalid sender | Misconfigured domain | Verify domain in ACS |

---

### 6.5 Blob Storage Issues

**Symptoms:**
- Cession agreement uploads failing
- 404 errors when viewing documents
- "Access Denied" errors

**Diagnostic Steps:**

```bash
# 1. Check storage account status
az storage account show \
  --name scfplatformstorage \
  --query "statusOfPrimary"

# 2. Check container exists
az storage container show \
  --name cession-agreements \
  --account-name scfplatformstorage

# 3. List recent uploads
az storage blob list \
  --container-name cession-agreements \
  --account-name scfplatformstorage \
  --query "[].{name:name, modified:properties.lastModified}" \
  --output table
```

**Resolution Steps:**

```bash
# If container is missing, recreate
az storage container create \
  --name cession-agreements \
  --account-name scfplatformstorage \
  --public-access off

# If connection string is wrong, update App Service
az webapp config appsettings set \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --settings AZURE_STORAGE_CONNECTION_STRING="<new-connection-string>"
```

---

### 6.6 High CPU/Memory Usage

**Symptoms:**
- Slow response times
- Application unresponsive
- Azure alerts for high resource usage

**Diagnostic Steps:**

```bash
# 1. Check current metrics
az monitor metrics list \
  --resource /subscriptions/{sub}/resourceGroups/fm-rg-dev-san/providers/Microsoft.Web/sites/fm-asp-dev-san \
  --metric "CpuPercentage,MemoryPercentage" \
  --interval PT1M

# 2. Check for memory leaks (Node.js)
# Look for increasing memory trend over time

# 3. Check active requests
# App Service > Diagnose and solve problems > High CPU
```

**Resolution Steps:**

1. **Immediate relief:** Restart application
2. **Short-term:** Scale up App Service plan
3. **Long-term:** Investigate code for memory leaks or inefficient queries

```bash
# Scale up temporarily
az appservice plan update \
  --name fm-asp-dev-san-plan \
  --resource-group fm-rg-dev-san \
  --sku B2

# Or scale out (add instances)
az webapp update \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --number-of-workers 2
```

---

### 6.7 SSL Certificate Issues

**Symptoms:**
- Browser showing "Not Secure"
- SSL handshake failures
- Certificate expiry warnings

**Diagnostic Steps:**

```bash
# Check certificate expiry
echo | openssl s_client -connect fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net:443 2>/dev/null | openssl x509 -noout -dates

# Check certificate chain
openssl s_client -connect fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net:443 -showcerts
```

**Resolution Steps:**

For Azure-managed certificates (*.azurewebsites.net):
- Certificates are auto-renewed by Azure
- If issues persist, contact Azure support

For custom domain certificates:

```bash
# Upload new certificate
az webapp config ssl upload \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --certificate-file /path/to/cert.pfx \
  --certificate-password "password"

# Bind certificate to domain
az webapp config ssl bind \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

---

### 6.8 Authentication Failures

**Symptoms:**
- Users unable to log in
- "Invalid credentials" for valid accounts
- JWT token errors

**Diagnostic Steps:**

```bash
# 1. Check application logs for [AUTH-ERROR]
az webapp log tail --name fm-asp-dev-san --resource-group fm-rg-dev-san

# 2. Verify JWT_SECRET is set
az webapp config appsettings list \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --query "[?name=='JWT_SECRET']"

# 3. Check user in database
mysql -e "SELECT user_id, username, email, role FROM users WHERE username='admin01';"
```

**Resolution Steps:**

1. **JWT_SECRET missing:** Re-add environment variable
2. **Password issues:** Reset user password in database

```sql
-- Reset admin password (use bcrypt hash)
UPDATE users 
SET password_hash = '$2b$10$...' 
WHERE username = 'admin01';
```

3. **Token expired:** User needs to log in again (normal behavior)

---

### 6.9 Create New Admin User

**When to use:** Need to add new administrator

```sql
-- Connect to MySQL
mysql -h futurefinancecashflow.mysql.database.azure.com -u scfadmin -p futurefinance_db

-- Generate bcrypt hash for password (use online tool or Node.js)
-- Example: "NewAdmin@2025" -> "$2b$10$..."

-- Insert new admin
INSERT INTO users (username, email, password_hash, role, created_at)
VALUES (
  'admin02',
  'admin02@company.com',
  '$2b$10$...bcrypt_hash...',
  'admin',
  NOW()
);

-- Verify
SELECT user_id, username, email, role FROM users WHERE username = 'admin02';
```

**Alternative:** Use the `create_admin.py` script in the project root.

---

### 6.10 Regenerate Supplier Access Token

**When to use:** Supplier's access link expired, need to resend

```sql
-- Connect to MySQL
mysql -h futurefinancecashflow.mysql.database.azure.com -u scfadmin -p futurefinance_db

-- Find supplier
SELECT supplier_id, company_name, email, status FROM suppliers 
WHERE email = 'supplier@example.com';

-- Generate new token (use Node.js crypto or uuid)
-- Example token: "abc123def456..."

-- Insert new access token
INSERT INTO access_tokens (supplier_id, token, token_type, expires_at, created_at)
VALUES (
  1,  -- supplier_id
  'new-unique-token-here',
  'approval',  -- or 'welcome'
  DATE_ADD(NOW(), INTERVAL 14 DAY),
  NOW()
);

-- Get the full access URL
SELECT CONCAT('https://fm-asp-dev-san.../supplier/access?token=', token) as access_url
FROM access_tokens 
WHERE supplier_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 7. Backup & Recovery

### 7.1 Backup Strategy

| Component | Backup Type | Frequency | Retention |
|-----------|-------------|-----------|-----------|
| MySQL Database | Automated Azure backup | Daily | 7 days |
| MySQL Database | Manual export | Weekly | 30 days |
| Blob Storage | Azure redundancy (LRS) | Real-time | N/A |
| Application Code | Git repository | On commit | Forever |
| Configuration | Azure Resource Manager | Weekly | 30 days |

### 7.2 Database Backup

#### Automated Backups (Azure)

```bash
# Check backup configuration
az mysql flexible-server show \
  --name futurefinancecashflow \
  --resource-group fm-rg-dev-san \
  --query "backup"

# List available restore points
az mysql flexible-server backup list \
  --name futurefinancecashflow \
  --resource-group fm-rg-dev-san
```

#### Manual Backup (Export)

```bash
# Export database
mysqldump -h futurefinancecashflow.mysql.database.azure.com \
  -u scfadmin -p \
  --ssl-mode=REQUIRED \
  --single-transaction \
  --routines \
  --triggers \
  futurefinance_db > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql

# Upload to Azure Blob Storage (archive)
az storage blob upload \
  --container-name backups \
  --account-name scfplatformstorage \
  --file backup_$(date +%Y%m%d).sql.gz \
  --name db/backup_$(date +%Y%m%d).sql.gz
```

### 7.3 Database Restore

#### Point-in-Time Restore (Azure)

```bash
# Restore to a new server (recommended for testing)
az mysql flexible-server restore \
  --name futurefinancecashflow-restored \
  --resource-group fm-rg-dev-san \
  --source-server futurefinancecashflow \
  --restore-time "2024-12-01T10:00:00Z"
```

#### Manual Restore

```bash
# Download backup
az storage blob download \
  --container-name backups \
  --account-name scfplatformstorage \
  --name db/backup_20241201.sql.gz \
  --file backup.sql.gz

# Decompress
gunzip backup.sql.gz

# Restore (CAUTION: This will overwrite existing data)
mysql -h futurefinancecashflow.mysql.database.azure.com \
  -u scfadmin -p \
  futurefinance_db < backup.sql
```

### 7.4 Application Recovery

```bash
# Redeploy from Git
az webapp deployment source sync \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san

# Or restore from deployment slot
az webapp deployment slot swap \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --slot staging \
  --target-slot production
```

### 7.5 Disaster Recovery Procedure

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 1 hour

#### Full DR Procedure

1. **Assess damage** (15 min)
   - Identify affected components
   - Determine data loss extent

2. **Provision new resources** (30 min)
   ```bash
   # Deploy infrastructure (if needed)
   az deployment group create \
     --resource-group fm-rg-dr-san \
     --template-file infra/main.bicep
   ```

3. **Restore database** (1 hour)
   - Use point-in-time restore
   - Verify data integrity

4. **Deploy application** (30 min)
   - Deploy from Git repository
   - Configure environment variables

5. **Verify functionality** (30 min)
   - Test all user flows
   - Verify integrations

6. **Update DNS** (15 min)
   - Point domain to new resources
   - Wait for propagation

7. **Notify stakeholders** (15 min)
   - Send recovery notification
   - Document incident

---

## 8. Scaling Procedures

### 8.1 Vertical Scaling (Scale Up)

**When to use:** Consistent high resource usage

```bash
# View current plan
az appservice plan show \
  --name fm-asp-dev-san-plan \
  --resource-group fm-rg-dev-san \
  --query "sku"

# Scale up to higher tier
az appservice plan update \
  --name fm-asp-dev-san-plan \
  --resource-group fm-rg-dev-san \
  --sku S1  # Options: B1, B2, B3, S1, S2, S3, P1v2, P2v2, P3v2
```

**App Service Tier Comparison:**

| Tier | vCPU | Memory | Cost/Month (approx) |
|------|------|--------|---------------------|
| B1 | 1 | 1.75 GB | $13 |
| B2 | 2 | 3.5 GB | $26 |
| S1 | 1 | 1.75 GB | $73 |
| P1v2 | 1 | 3.5 GB | $146 |

### 8.2 Horizontal Scaling (Scale Out)

**When to use:** Handle more concurrent users

```bash
# Scale out to multiple instances
az webapp update \
  --name fm-asp-dev-san \
  --resource-group fm-rg-dev-san \
  --number-of-workers 3

# Configure auto-scaling rules (S1 tier and above)
az monitor autoscale create \
  --resource-group fm-rg-dev-san \
  --resource fm-asp-dev-san \
  --resource-type Microsoft.Web/sites \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

### 8.3 Database Scaling

```bash
# Scale up MySQL
az mysql flexible-server update \
  --name futurefinancecashflow \
  --resource-group fm-rg-dev-san \
  --sku-name Standard_B2s  # Options: Burstable, General Purpose, Memory Optimized

# Increase storage
az mysql flexible-server update \
  --name futurefinancecashflow \
  --resource-group fm-rg-dev-san \
  --storage-size 64  # GB
```

---

## 9. Maintenance Windows

### 9.1 Scheduled Maintenance

| Type | Window | Duration | Notification |
|------|--------|----------|--------------|
| Routine updates | Sunday 02:00-06:00 SAST | 4 hours | 48 hours |
| Security patches | ASAP (after testing) | 1 hour | 24 hours |
| Major upgrades | Saturday 22:00 SAST | 6 hours | 1 week |
| Database maintenance | Sunday 03:00-05:00 SAST | 2 hours | 48 hours |

### 9.2 Pre-Maintenance Checklist

- [ ] Notify stakeholders (email + Teams)
- [ ] Verify backup completed successfully
- [ ] Prepare rollback plan
- [ ] Test changes in staging environment
- [ ] Schedule on-call coverage
- [ ] Prepare status page update

### 9.3 Post-Maintenance Checklist

- [ ] Verify application health
- [ ] Test critical user flows
- [ ] Check error rates in monitoring
- [ ] Confirm all integrations working
- [ ] Update status page to "Operational"
- [ ] Send completion notification
- [ ] Document any issues encountered

### 9.4 Maintenance Notification Template

```
SCHEDULED MAINTENANCE NOTICE

System: SCF Platform
Date: [Date]
Time: [Start Time] - [End Time] SAST
Impact: [Brief description]

During this window:
- [What will be unavailable]
- [What will remain available]

Actions required:
- [Any user actions needed]

Questions: Contact support@futurecashflow.co.za
```

---

## 10. Contact & Escalation

### 10.1 On-Call Rotation

| Week | Primary | Secondary | Manager |
|------|---------|-----------|---------|
| Week 1 | Engineer A | Engineer B | Lead 1 |
| Week 2 | Engineer B | Engineer C | Lead 1 |
| Week 3 | Engineer C | Engineer A | Lead 2 |
| Week 4 | Engineer A | Engineer B | Lead 2 |

### 10.2 Contact Directory

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | Rotation | +27 XX XXX XXXX | oncall@company.com |
| Platform Lead | [Name] | +27 XX XXX XXXX | lead@company.com |
| Engineering Manager | [Name] | +27 XX XXX XXXX | manager@company.com |
| DBA | [Name] | +27 XX XXX XXXX | dba@company.com |
| Security Lead | [Name] | +27 XX XXX XXXX | security@company.com |

### 10.3 External Contacts

| Service | Support Portal | Phone |
|---------|----------------|-------|
| Azure Support | portal.azure.com | Microsoft Support |
| Domain Registrar | [Portal URL] | [Phone] |
| Email Provider | Azure Portal | Microsoft Support |

### 10.4 Escalation Timeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESCALATION TIMELINE                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  0 min    Alert received                                                │
│  │                                                                      │
│  5 min    On-call acknowledges                                         │
│  │                                                                      │
│  15 min   If SEV1/2 not acknowledged → Escalate to Secondary          │
│  │                                                                      │
│  30 min   If SEV1 not mitigated → Escalate to Manager                  │
│  │                                                                      │
│  60 min   If SEV1 continues → Executive notification                   │
│  │                                                                      │
│  2 hours  If ongoing → War room + all hands                            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Useful Commands

### Azure CLI Quick Reference

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# List resources in resource group
az resource list --resource-group fm-rg-dev-san --output table

# View App Service logs (live)
az webapp log tail --name fm-asp-dev-san --resource-group fm-rg-dev-san

# Check App Service status
az webapp show --name fm-asp-dev-san --resource-group fm-rg-dev-san --query state

# Restart App Service
az webapp restart --name fm-asp-dev-san --resource-group fm-rg-dev-san

# View environment variables
az webapp config appsettings list --name fm-asp-dev-san --resource-group fm-rg-dev-san

# Set environment variable
az webapp config appsettings set --name fm-asp-dev-san --resource-group fm-rg-dev-san \
  --settings KEY=VALUE
```

### MySQL Quick Reference

```sql
-- Check database size
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'futurefinance_db'
GROUP BY table_schema;

-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'futurefinance_db'
ORDER BY (data_length + index_length) DESC;

-- Check active connections
SHOW PROCESSLIST;

-- Kill a query
KILL <process_id>;

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';

-- Recent audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

---

## Appendix B: Incident Post-Mortem Template

```markdown
# Incident Post-Mortem

## Incident Summary
- **Incident ID:** INC-XXXX
- **Date:** YYYY-MM-DD
- **Duration:** X hours Y minutes
- **Severity:** SEV1/2/3/4
- **Owner:** [Name]

## Timeline
| Time (SAST) | Event |
|-------------|-------|
| HH:MM | Alert triggered |
| HH:MM | On-call acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |

## Impact
- Users affected: X
- Revenue impact: R X
- Data loss: None / X records

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What was done to fix the issue]

## Action Items
| ID | Action | Owner | Due Date | Status |
|----|--------|-------|----------|--------|
| 1 | [Action] | [Name] | [Date] | Open |

## Lessons Learned
- What went well:
- What could be improved:

## Appendix
[Relevant logs, screenshots, metrics]
```

---

## Document Information

| Property | Value |
|----------|-------|
| Document Title | SCF Platform Operations & Runbook |
| Version | 1.0 |
| Created | December 2025 |
| Author | SCF Platform Team |
| Classification | Internal - Operations |
| Review Cycle | Quarterly |

---

*© 2025 Future Cashflow (Pty) Ltd. All rights reserved.*
