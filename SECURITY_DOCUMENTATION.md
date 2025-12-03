# SCF Platform Security Documentation

## Supply Chain Finance Platform - Security Architecture & Guidelines

**Version:** 1.0  
**Last Updated:** December 2025  
**Classification:** Confidential - Internal Use Only

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Security](#3-data-security)
4. [Network Security](#4-network-security)
5. [Application Security](#5-application-security)
6. [Infrastructure Security](#6-infrastructure-security)
7. [Compliance & Regulations](#7-compliance--regulations)
8. [Security Monitoring](#8-security-monitoring)
9. [Incident Response](#9-incident-response)
10. [Security Checklist](#10-security-checklist)

---

## 1. Security Overview

### 1.1 Security Principles

The SCF Platform follows these core security principles:

| Principle | Description |
|-----------|-------------|
| **Defense in Depth** | Multiple layers of security controls |
| **Least Privilege** | Users have minimum necessary access |
| **Zero Trust** | Verify explicitly, never trust implicitly |
| **Secure by Default** | Security enabled out of the box |
| **Privacy by Design** | Data protection built into architecture |

### 1.2 Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: NETWORK SECURITY                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ HTTPS/TLS 1.2+ │ Azure DDoS Protection │ WAF (optional)            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  LAYER 2: APPLICATION SECURITY                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ JWT Authentication │ CSRF Protection │ Input Validation │ XSS Guard│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  LAYER 3: DATA SECURITY                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Encryption at Rest │ Encryption in Transit │ Secure Key Management │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  LAYER 4: ACCESS CONTROL                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Role-Based Access │ Audit Logging │ Session Management              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Security Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Development Team** | Secure coding, vulnerability fixes, security testing |
| **Operations Team** | Infrastructure security, monitoring, patching |
| **Security Team** | Policy, audits, incident response, compliance |
| **Business Users** | Password hygiene, reporting suspicious activity |

---

## 2. Authentication & Authorization

### 2.1 Authentication Methods

#### Admin Authentication

| Property | Implementation |
|----------|----------------|
| Method | Username + Password |
| Password Storage | bcrypt (10 salt rounds) |
| Session | JWT token (30 min expiry) |
| Token Storage | HTTP-only secure cookie |

```typescript
// Password hashing implementation
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### AP (Accounts Payable) Authentication

| Property | Implementation |
|----------|----------------|
| Method | Email + Password + OTP (2FA) |
| OTP Delivery | Azure Communication Services (Email) |
| OTP Validity | 10 minutes |
| OTP Length | 6 digits |
| Session | JWT token (30 min expiry) |

```typescript
// OTP generation
const otp = Math.floor(100000 + Math.random() * 900000).toString();
// Store with expiry: NOW() + 10 minutes
```

#### Supplier Authentication

| Property | Implementation |
|----------|----------------|
| Method | Secure access token (URL-based) |
| Token Generation | crypto.randomBytes(32) |
| Token Validity | 14 days |
| Session | JWT token (2 hours) |

```typescript
// Token generation
import crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex');
// 64-character secure random token
```

### 2.2 JWT Implementation

#### Token Structure

```typescript
// JWT Payload
{
  userId: string,
  email: string,
  role: 'admin' | 'ap' | 'supplier',
  supplierId?: string,  // Only for suppliers
  iat: number,          // Issued at
  exp: number           // Expiration
}
```

#### Security Settings

```typescript
// lib/auth/session.ts
const SESSION_DURATION = 30 * 60 * 1000;           // 30 minutes (Admin/AP)
const SUPPLIER_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours (Supplier)

// Cookie settings
{
  name: 'session',
  httpOnly: true,      // Prevents XSS access
  secure: true,        // HTTPS only in production
  sameSite: 'lax',     // CSRF protection
  path: '/',
  maxAge: SESSION_DURATION
}
```

### 2.3 Authorization (RBAC)

#### Role Permissions Matrix

| Resource | Admin | AP | Supplier |
|----------|-------|-----|----------|
| Dashboard (Admin) | ✅ | ❌ | ❌ |
| Dashboard (AP) | ❌ | ✅ | ❌ |
| Dashboard (Supplier) | ❌ | ❌ | ✅ |
| Upload Vendors | ❌ | ✅ | ❌ |
| Upload Invoices | ❌ | ✅ | ❌ |
| Approve Suppliers | ✅ | ❌ | ❌ |
| View All Suppliers | ✅ | ❌ | ❌ |
| View Own Profile | ❌ | ❌ | ✅ |
| Accept/Reject Offers | ❌ | ❌ | ✅ |
| Process Payments | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ❌ |

#### Route Protection (Middleware)

```typescript
// middleware.ts
const protectedRoutes = {
  '/admin': ['admin'],
  '/ap': ['ap'],
  '/supplier': ['supplier']
};

// Verification flow:
// 1. Check for session cookie
// 2. Verify JWT signature
// 3. Check token expiration
// 4. Verify role matches route
// 5. Allow or redirect to login
```

### 2.4 Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum Length | 8 characters |
| Uppercase Required | Yes (1+) |
| Lowercase Required | Yes (1+) |
| Number Required | Yes (1+) |
| Special Character Required | Yes (1+) |
| Password History | Last 5 passwords |
| Maximum Age | 90 days |
| Account Lockout | After 5 failed attempts |
| Lockout Duration | 30 minutes |

#### Password Validation (Recommended)

```typescript
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validatePassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
```

### 2.5 Session Management

| Setting | Value | Purpose |
|---------|-------|---------|
| Session Duration (Admin/AP) | 30 minutes | Limit exposure window |
| Session Duration (Supplier) | 2 hours | Balance security/usability |
| Idle Timeout | Same as session | Auto-logout inactive users |
| Concurrent Sessions | Allowed | Support multiple devices |
| Session Revocation | On logout | Clear cookies immediately |

---

## 3. Data Security

### 3.1 Data Classification

| Classification | Description | Examples | Controls |
|----------------|-------------|----------|----------|
| **Public** | Non-sensitive information | Marketing content | None required |
| **Internal** | Business information | Reports, metrics | Role-based access |
| **Confidential** | Sensitive business data | Supplier details, invoices | Encryption, audit logging |
| **Restricted** | Highly sensitive data | Bank details, passwords | Full encryption, strict access |

### 3.2 Encryption

#### Encryption at Rest

| Data Type | Encryption Method | Key Management |
|-----------|-------------------|----------------|
| MySQL Database | Azure TDE (Transparent Data Encryption) | Azure-managed |
| Blob Storage | Azure Storage Service Encryption (SSE) | Azure-managed |
| Backups | AES-256 | Azure-managed |

#### Encryption in Transit

| Connection | Protocol | Cipher |
|------------|----------|--------|
| Browser ↔ App | HTTPS/TLS 1.2+ | Modern cipher suites |
| App ↔ MySQL | TLS 1.2 (Required) | MySQL SSL |
| App ↔ Blob Storage | HTTPS | Azure-managed |
| App ↔ Email Service | HTTPS | Azure-managed |

```typescript
// MySQL SSL Configuration (lib/db.ts)
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});
```

### 3.3 Sensitive Data Handling

#### Password Storage

```typescript
// NEVER store plain text passwords
// Use bcrypt with appropriate cost factor

import bcrypt from 'bcryptjs';

// Hashing (on registration/password change)
const hash = await bcrypt.hash(password, 10);

// Verification (on login)
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

#### Banking Information

| Field | Storage | Display |
|-------|---------|---------|
| Bank Account Number | Full (encrypted at rest) | Last 4 digits only |
| Branch Code | Full | Full |
| SWIFT/BIC | Full | Full |
| IBAN | Full (encrypted at rest) | Last 4 characters |

```typescript
// Masking bank account for display
function maskAccountNumber(account: string): string {
  return '****' + account.slice(-4);
}
```

### 3.4 Data Retention

| Data Type | Retention Period | Disposal Method |
|-----------|------------------|-----------------|
| User Accounts | Active + 7 years | Anonymization |
| Audit Logs | 7 years | Secure deletion |
| Session Data | Session duration | Auto-expire |
| Invoices | 7 years | Anonymization |
| Cession Agreements | 10 years | Secure archive |
| Backup Data | 30 days | Secure deletion |

### 3.5 PII (Personal Identifiable Information)

| PII Field | Purpose | Protection |
|-----------|---------|------------|
| Email Address | Communication, authentication | Access control |
| Phone Number | Contact | Access control |
| Physical Address | Business verification | Access control |
| Contact Person Name | Communication | Access control |
| VAT Number | Tax compliance | Access control |
| Bank Details | Payment processing | Encryption + access control |

---

## 4. Network Security

### 4.1 Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NETWORK SECURITY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           INTERNET                                           │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │  Azure DDoS     │                                      │
│                    │  Protection     │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│                             ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │  HTTPS (443)    │                                      │
│                    │  TLS 1.2+       │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│          ┌──────────────────┼──────────────────┐                           │
│          ▼                  ▼                  ▼                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │ App Service  │  │    MySQL     │  │    Blob      │                      │
│  │ (Public)     │──│  (Private)   │  │  Storage     │                      │
│  │              │  │              │  │  (Private)   │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Firewall Rules

#### App Service

| Rule | Source | Destination | Port | Action |
|------|--------|-------------|------|--------|
| HTTPS In | Any | App Service | 443 | Allow |
| HTTP Redirect | Any | App Service | 80 | Redirect to 443 |

#### MySQL Database

| Rule | Source | Destination | Port | Action |
|------|--------|-------------|------|--------|
| App Service | App Service IP | MySQL | 3306 | Allow |
| Admin Access | Office IP range | MySQL | 3306 | Allow |
| Default | Any | MySQL | 3306 | Deny |

### 4.3 SSL/TLS Configuration

#### Minimum TLS Version

```
TLS 1.2 (Required)
TLS 1.3 (Preferred where supported)
```

#### Cipher Suites (Recommended)

```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-RSA-AES128-GCM-SHA256
```

### 4.4 CORS Configuration

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'Access-Control-Allow-Origin',
    value: 'https://your-domain.com'  // Specific domain only
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, OPTIONS'
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization'
  }
];
```

---

## 5. Application Security

### 5.1 SQL Injection Prevention

**All database queries use parameterized statements:**

```typescript
// ✅ CORRECT - Parameterized query
const [rows] = await pool.execute(
  'SELECT * FROM suppliers WHERE email = ?',
  [email]
);

// ❌ WRONG - String concatenation (vulnerable)
const [rows] = await pool.execute(
  `SELECT * FROM suppliers WHERE email = '${email}'`  // NEVER DO THIS
);
```

### 5.2 XSS (Cross-Site Scripting) Prevention

#### React/Next.js Built-in Protection

```tsx
// React automatically escapes values in JSX
<div>{userInput}</div>  // Safe - React escapes this

// Dangerous - only use with trusted content
<div dangerouslySetInnerHTML={{ __html: content }} />  // Avoid if possible
```

#### Content Security Policy (Recommended)

```typescript
// next.config.mjs headers
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}
```

### 5.3 CSRF Protection

```typescript
// SameSite cookie attribute
{
  sameSite: 'lax'  // Prevents CSRF in most cases
}

// For sensitive actions, verify origin header
function verifyCsrf(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];
  return allowedOrigins.includes(origin);
}
```

### 5.4 Input Validation

```typescript
// Server-side validation for all inputs
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000000;
}

function validateVendorCode(code: string): boolean {
  return /^[A-Z0-9]{1,20}$/.test(code);
}

// CSV upload validation
function validateCsvRow(row: any): ValidationResult {
  const errors = [];
  
  if (!row.vendor_code) errors.push('Missing vendor_code');
  if (!validateEmail(row.email)) errors.push('Invalid email format');
  if (row.amount && !validateAmount(row.amount)) errors.push('Invalid amount');
  
  return { valid: errors.length === 0, errors };
}
```

### 5.5 File Upload Security

```typescript
// Cession agreement upload validation
const ALLOWED_MIME_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFileUpload(file: File): ValidationResult {
  const errors = [];
  
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Only PDF files are allowed');
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('File must have .pdf extension');
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 5.6 Security Headers

```typescript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'  // Prevent clickjacking
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'  // Prevent MIME sniffing
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'  // XSS filter
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'  // HSTS
        }
      ]
    }
  ];
}
```

### 5.7 Error Handling

```typescript
// Never expose internal errors to users
try {
  await databaseOperation();
} catch (error) {
  // Log full error internally
  console.error('[DB-ERROR]', error);
  
  // Return generic message to user
  return { 
    success: false, 
    error: 'An error occurred. Please try again.' 
  };
}

// Never include stack traces in production responses
if (process.env.NODE_ENV === 'production') {
  // Generic error only
} else {
  // Include debug info in development
}
```

---

## 6. Infrastructure Security

### 6.1 Azure Security Best Practices

#### App Service

| Setting | Configuration |
|---------|---------------|
| HTTPS Only | Enabled |
| Minimum TLS Version | 1.2 |
| FTP State | Disabled |
| Remote Debugging | Disabled |
| HTTP 2.0 | Enabled |
| Client Certificates | Optional |

#### MySQL Flexible Server

| Setting | Configuration |
|---------|---------------|
| SSL Enforcement | Enabled |
| Minimum TLS | 1.2 |
| Public Access | Disabled (use Private Endpoint) or Firewall rules |
| Azure AD Authentication | Enabled (optional) |
| Audit Logging | Enabled |

#### Blob Storage

| Setting | Configuration |
|---------|---------------|
| Public Access | Disabled |
| Secure Transfer Required | Enabled |
| Storage Firewalls | Enabled |
| Soft Delete | Enabled (7 days) |
| Versioning | Enabled |

### 6.2 Secret Management

#### Environment Variables

```bash
# Secrets should be stored in Azure App Service Configuration
# Never commit secrets to source control

# .env.example (safe to commit)
DATABASE_HOST=your-host-here
DATABASE_PASSWORD=your-password-here  # Use Azure Key Vault in production

# Azure Key Vault (Recommended for production)
az keyvault secret set --vault-name scf-keyvault --name DATABASE-PASSWORD --value "secret"
```

#### Key Vault Integration (Recommended)

```typescript
// Reference secrets from Key Vault
// App Service Configuration:
// DATABASE_PASSWORD=@Microsoft.KeyVault(SecretUri=https://scf-keyvault.vault.azure.net/secrets/DATABASE-PASSWORD)
```

### 6.3 Logging & Audit

#### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  supplier_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_action (action),
  INDEX idx_created (created_at),
  INDEX idx_user (user_id)
);
```

#### Logged Events

| Event | Logged Fields |
|-------|---------------|
| Login Success | user_id, ip, user_agent, timestamp |
| Login Failure | email attempted, ip, timestamp |
| Supplier Approved | admin_id, supplier_id, timestamp |
| Offer Accepted | supplier_id, offer_id, amount, timestamp |
| Payment Processed | admin_id, payment_id, amount, timestamp |
| Settings Changed | admin_id, setting_key, old_value, new_value |
| Password Changed | user_id, timestamp |
| File Uploaded | supplier_id, file_type, file_size, timestamp |

### 6.4 Vulnerability Management

#### Regular Security Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Dependency scan (npm audit) | Weekly | Dev Team |
| Container image scan | On build | CI/CD |
| Penetration testing | Annually | Security Team |
| Code security review | On PR | Dev Team |
| SSL certificate check | Monthly | Ops Team |

#### npm Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force
```

---

## 7. Compliance & Regulations

### 7.1 POPIA (Protection of Personal Information Act)

The SCF Platform complies with South African POPIA requirements:

| POPIA Principle | Implementation |
|-----------------|----------------|
| **Accountability** | Designated information officer |
| **Processing Limitation** | Only collect necessary data |
| **Purpose Specification** | Clear privacy policy |
| **Further Processing Limitation** | Data not shared without consent |
| **Information Quality** | Accurate, up-to-date records |
| **Openness** | Transparent privacy practices |
| **Security Safeguards** | Encryption, access controls |
| **Data Subject Participation** | Users can request their data |

### 7.2 Data Subject Rights

| Right | Implementation |
|-------|----------------|
| Right to Access | Export user data on request |
| Right to Correction | Update profile functionality |
| Right to Deletion | Account deletion process |
| Right to Object | Opt-out mechanisms |

### 7.3 Privacy Policy Requirements

The platform privacy policy must include:

- [ ] Types of data collected
- [ ] Purpose of data collection
- [ ] Third parties data is shared with
- [ ] Data retention periods
- [ ] User rights and how to exercise them
- [ ] Security measures in place
- [ ] Contact information for privacy queries

### 7.4 Financial Regulations

| Regulation | Applicability | Compliance Measures |
|------------|--------------|---------------------|
| NCR (National Credit Regulator) | Registration NCRCP18174 | Licensed operation |
| FICA (Financial Intelligence Centre Act) | Know Your Customer | Supplier verification |
| Banking Regulations | Payment processing | Bank account verification |

---

## 8. Security Monitoring

### 8.1 Security Alerts

#### Critical Alerts

| Alert | Trigger | Response |
|-------|---------|----------|
| Multiple failed logins | 5+ failures in 5 min | Block IP, notify admin |
| Unusual admin activity | After-hours login | Verify with user |
| Database access spike | 10x normal queries | Investigate immediately |
| Large data export | Export > 1000 records | Review and verify |
| New admin created | Admin user added | Verify authorization |

#### Warning Alerts

| Alert | Trigger | Response |
|-------|---------|----------|
| SSL certificate expiring | < 30 days | Renew certificate |
| Unusual traffic pattern | 3x normal traffic | Monitor for DDoS |
| Failed API calls spike | > 100 failures/min | Check for attack |

### 8.2 Security Metrics Dashboard

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Failed Logins/Hour | < 10 | 10-50 | > 50 |
| Active Sessions | < 100 | 100-500 | > 500 |
| API Error Rate | < 1% | 1-5% | > 5% |
| Average Response Time | < 500ms | 500ms-2s | > 2s |

### 8.3 Security Log Review

#### Daily Review

- Failed login attempts
- Admin actions (approvals, settings changes)
- Unusual access patterns
- Error logs for security issues

#### Weekly Review

- New user accounts created
- Permission changes
- Access from new locations
- Data export activities

#### Monthly Review

- Complete audit log review
- Access pattern analysis
- Vulnerability scan results
- Compliance checklist verification

---

## 9. Incident Response

### 9.1 Security Incident Classification

| Level | Description | Examples | Response Time |
|-------|-------------|----------|---------------|
| P1 - Critical | Active breach, data exposure | Data leak, ransomware | Immediate |
| P2 - High | Potential breach, vulnerability exploited | Suspicious access, SQL injection attempt | 1 hour |
| P3 - Medium | Security policy violation | Weak password, unauthorized access attempt | 24 hours |
| P4 - Low | Minor security issue | Failed vulnerability scan, outdated library | 1 week |

### 9.2 Incident Response Steps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SECURITY INCIDENT RESPONSE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. IDENTIFY (Immediate)                                                    │
│     └─► Confirm incident, assess scope, classify severity                   │
│                                                                              │
│  2. CONTAIN (< 15 min for P1)                                               │
│     └─► Isolate affected systems, block attack vectors                      │
│                                                                              │
│  3. NOTIFY (Based on severity)                                              │
│     └─► Internal: Security team, management                                 │
│     └─► External: Regulators, affected users (if data breach)              │
│                                                                              │
│  4. INVESTIGATE                                                              │
│     └─► Collect evidence, determine root cause                              │
│                                                                              │
│  5. ERADICATE                                                                │
│     └─► Remove threat, patch vulnerabilities                                │
│                                                                              │
│  6. RECOVER                                                                  │
│     └─► Restore services, verify security                                   │
│                                                                              │
│  7. LESSONS LEARNED                                                          │
│     └─► Post-incident review, update procedures                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Data Breach Response

#### POPIA Notification Requirements

If personal information is compromised:

1. **Notify Regulator:** Within 72 hours
2. **Notify Affected Parties:** As soon as reasonably possible
3. **Document:** All actions taken

#### Breach Notification Template

```
SECURITY INCIDENT NOTIFICATION

Date: [Date]
Incident Type: [Type]

What Happened:
[Brief description]

Information Affected:
[Types of data]

What We're Doing:
[Actions taken]

What You Can Do:
[Recommended actions for users]

Contact:
[Security team contact]
```

### 9.4 Emergency Contacts

| Role | Contact | When to Notify |
|------|---------|----------------|
| Security Lead | [Email/Phone] | All P1/P2 incidents |
| CTO | [Email/Phone] | P1 incidents, data breaches |
| Legal Counsel | [Email/Phone] | Data breaches, regulatory issues |
| Information Regulator | [Official contact] | Data breaches (POPIA) |

---

## 10. Security Checklist

### 10.1 Development Checklist

- [ ] All inputs validated on server-side
- [ ] Parameterized queries for all database operations
- [ ] Passwords hashed with bcrypt (cost 10+)
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internals
- [ ] Dependencies regularly updated
- [ ] No secrets in source code
- [ ] Security headers configured
- [ ] HTTPS enforced

### 10.2 Deployment Checklist

- [ ] Environment variables set correctly
- [ ] Debug mode disabled
- [ ] TLS 1.2+ enforced
- [ ] Firewall rules configured
- [ ] SSL certificate valid
- [ ] Logging enabled
- [ ] Monitoring configured
- [ ] Backup verified
- [ ] Access controls tested

### 10.3 Operational Checklist

- [ ] Admin accounts reviewed monthly
- [ ] Access logs reviewed weekly
- [ ] Security patches applied promptly
- [ ] Backup restoration tested quarterly
- [ ] Penetration test completed annually
- [ ] Security training completed annually
- [ ] Incident response plan tested
- [ ] Disaster recovery tested

### 10.4 Code Review Security Checklist

| Category | Check |
|----------|-------|
| **Authentication** | Proper session handling |
| **Authorization** | Role checks on all endpoints |
| **Input Validation** | All user input sanitized |
| **Output Encoding** | XSS prevention |
| **Database** | Parameterized queries only |
| **Files** | Upload validation, safe paths |
| **Logging** | No sensitive data logged |
| **Errors** | Generic error messages |
| **Secrets** | No hardcoded credentials |
| **Dependencies** | No known vulnerabilities |

---

## Appendix A: Security Tools

### Recommended Tools

| Purpose | Tool | Usage |
|---------|------|-------|
| Dependency Audit | npm audit | Weekly |
| Static Analysis | SonarQube | On PR |
| Secret Detection | git-secrets, gitleaks | Pre-commit |
| Container Scanning | Trivy | On build |
| Web Vulnerability | OWASP ZAP | Quarterly |
| SSL Testing | SSL Labs | Monthly |

### npm Security Commands

```bash
# Check for vulnerabilities
npm audit

# View detailed report
npm audit --json

# Fix vulnerabilities
npm audit fix

# Update specific package
npm update package-name

# Check outdated packages
npm outdated
```

---

## Appendix B: Security References

### Standards & Frameworks

- OWASP Top 10: https://owasp.org/Top10/
- SANS Top 25: https://www.sans.org/top25-software-errors/
- POPIA: https://popia.co.za/
- Azure Security Best Practices: https://docs.microsoft.com/azure/security/

### Useful Resources

- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- Azure Security Center: https://docs.microsoft.com/azure/security-center/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/

---

## Document Information

| Property | Value |
|----------|-------|
| Document Title | SCF Platform Security Documentation |
| Version | 1.0 |
| Created | December 2025 |
| Author | SCF Platform Security Team |
| Classification | Confidential - Internal |
| Review Cycle | Quarterly |
| Next Review | March 2026 |

---

*© 2025 Future Cashflow (Pty) Ltd. All rights reserved.*

*This document contains confidential security information. Distribution is limited to authorized personnel only.*
