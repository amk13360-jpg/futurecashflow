# Future Cashflow - Supply Chain Finance Platform
## Technical Documentation

**Version:** 1.0.0  
**Last Updated:** December 3, 2025  
**Platform:** Azure App Service (Linux)  
**Repository:** Azure DevOps - Future Mining Project

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Core Modules](#6-core-modules)
7. [API Reference](#7-api-reference)
8. [Email Service](#8-email-service)
9. [File Storage](#9-file-storage)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Security Considerations](#11-security-considerations)
12. [Error Handling](#12-error-handling)
13. [Environment Configuration](#13-environment-configuration)

---

## 1. Executive Summary

### 1.1 Platform Overview

Future Cashflow is an enterprise-grade **Supply Chain Finance (SCF) Platform** designed for the mining industry in South Africa. The platform facilitates early payment programs between mining companies (buyers) and their suppliers, enabling:

- **Suppliers** to receive early payment on approved invoices at a discount
- **Buyers** to extend payment terms while maintaining supplier relationships
- **Platform Administrators** to manage the entire financing lifecycle

### 1.2 Business Context

| Entity | Role |
|--------|------|
| **Future Mining Finance (Pty) Ltd** | Platform operator, registered Credit Provider (NCRCP18174) |
| **Mining Companies** | Buyers who approve invoices and repay at maturity |
| **Suppliers/Vendors** | SMEs in mining supply chain seeking early payment |

### 1.3 Key Metrics

- **Currency:** South African Rand (ZAR)
- **Default Discount Rate:** 12.5% per annum
- **Offer Expiry:** 7 days
- **Token Validity:** 14 days

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AZURE APP SERVICE (Linux Node.js 20)                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Next.js 16 Application                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Frontend   │  │  API Routes  │  │Server Actions│               │    │
│  │  │  (React 19)  │  │  (/api/*)    │  │ (lib/actions)│               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                         │                        │
          ▼                         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Azure MySQL    │    │  Azure Blob      │    │ Azure Comm.      │
│   (SSL/TLS 1.2)  │    │  Storage         │    │ Services (Email) │
│                  │    │                  │    │                  │
│ futurefinance... │    │ fmscfplatform... │    │ fm-acs-dev-san   │
│ .mysql.database  │    │ /cession-        │    │                  │
│ .azure.com       │    │ agreements       │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### 2.2 Application Layers

| Layer | Directory | Purpose |
|-------|-----------|---------|
| **Presentation** | `app/`, `components/` | React components, pages, layouts |
| **API** | `app/api/` | REST endpoints for client-side fetches |
| **Business Logic** | `lib/actions/` | Server actions with database operations |
| **Services** | `lib/services/` | External integrations (email, storage) |
| **Data Access** | `lib/db.ts` | MySQL connection pool management |
| **Authentication** | `lib/auth/` | Session, password, audit utilities |

### 2.3 Request Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│   middleware.ts │ ─── Route protection, session validation
└─────────────────┘
      │
      ▼
┌─────────────────┐
│   app/page.tsx  │ ─── Server Component (RSC) or Client Component
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ lib/actions/*.ts│ ─── Server Actions (database queries)
└─────────────────┘
      │
      ▼
┌─────────────────┐
│   lib/db.ts     │ ─── MySQL connection pool
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  Azure MySQL    │ ─── Persistent data storage
└─────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.0 | React framework with App Router |
| **React** | 19.0.0 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Accessible component library |
| **Lucide React** | 0.548.0 | Icon library |
| **next-themes** | 0.4.6 | Dark/light mode support |
| **Sonner** | 2.0.7 | Toast notifications |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20 LTS | Server runtime |
| **mysql2** | 3.15.3 | MySQL driver with connection pooling |
| **jose** | 6.1.0 | JWT token signing/verification |
| **bcryptjs** | 3.0.2 | Password hashing |
| **pdf-lib** | 1.17.1 | PDF generation for cession agreements |

### 3.3 Azure Services

| Service | Resource Name | Purpose |
|---------|---------------|---------|
| **App Service** | fm-asp-dev-san | Web application hosting |
| **MySQL Flexible Server** | futurefinancecashflow | Database |
| **Blob Storage** | fmscfplatformstorage | Document storage |
| **Communication Services** | fm-acs-dev-san | Email delivery |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| **Azure DevOps** | CI/CD pipelines, Git repository |
| **VS Code** | IDE with TypeScript support |
| **pnpm** | Package manager |

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   buyers    │       │  suppliers  │       │    users    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ buyer_id PK │◄──┐   │supplier_id  │   ┌──►│ user_id PK  │
│ name        │   │   │ PK          │   │   │ username    │
│ code UK     │   │   │ vendor_no UK│   │   │ email UK    │
│ contact_*   │   │   │ company_code│   │   │ password_   │
│ active_stat │   │   │ name        │   │   │   hash      │
└─────────────┘   │   │ contact_*   │   │   │ role        │
                  │   │ bank_*      │   │   │ buyer_id FK │
                  │   │ onboarding_ │   │   └─────────────┘
                  │   │   status    │   │
                  │   └─────────────┘   │
                  │         │           │
                  │         │           │
┌─────────────┐   │   ┌─────────────┐   │   ┌─────────────┐
│  invoices   │   │   │   offers    │   │   │  payments   │
├─────────────┤   │   ├─────────────┤   │   ├─────────────┤
│invoice_id PK│   │   │ offer_id PK │   │   │payment_id PK│
│ buyer_id FK │───┘   │invoice_id FK│───┼──►│ offer_id FK │
│supplier_id  │──────►│supplier_id  │   │   │supplier_id  │
│   FK        │       │   FK        │   │   │   FK        │
│ vendor_no   │       │ buyer_id FK │───┘   │ amount      │
│ company_code│       │ annual_rate │       │ status      │
│ amount      │       │ discount_amt│       │ batch_id    │
│ status      │       │ net_payment │       │ processed_by│
│ due_date    │       │ status      │       │   FK        │
└─────────────┘       └─────────────┘       └─────────────┘
        │                   │
        │                   │
        ▼                   ▼
┌─────────────────────────────────────┐
│           Supporting Tables          │
├─────────────────────────────────────┤
│ supplier_tokens  - Access tokens     │
│ otp_codes        - 2FA codes         │
│ cession_agree... - Signed documents  │
│ bank_change_req  - Bank updates      │
│ repayments       - Buyer repayments  │
│ audit_logs       - Activity tracking │
│ notifications    - Email/SMS queue   │
│ system_settings  - Configuration     │
└─────────────────────────────────────┘
```

### 4.2 Core Tables

#### 4.2.1 buyers
Stores mining company information.

```sql
CREATE TABLE buyers (
  buyer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,           -- e.g., "1000", "2000"
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  active_status ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4.2.2 suppliers
Stores vendor/supplier master data from ERP.

```sql
CREATE TABLE suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_number VARCHAR(50) UNIQUE,           -- ERP vendor number
  company_code VARCHAR(20),                   -- Links to buyer
  name VARCHAR(255) NOT NULL,
  vat_no VARCHAR(50) UNIQUE,
  registration_no VARCHAR(100),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  physical_address TEXT,
  address TEXT,                               -- From ERP
  
  -- Bank Details
  bank_name VARCHAR(100),
  bank_account_no VARCHAR(50),
  bank_branch_code VARCHAR(20),
  bank_key_branch_code VARCHAR(20),           -- From ERP
  bank_account_type ENUM('current','savings','business') DEFAULT 'business',
  bank_country VARCHAR(2) DEFAULT 'ZA',
  iban VARCHAR(50),
  swift_bic VARCHAR(20),
  
  -- Payment Defaults
  default_payment_method VARCHAR(50),
  default_payment_terms VARCHAR(100),
  reconciliation_gl_account VARCHAR(50),
  
  -- Status
  risk_tier ENUM('low','medium','high') DEFAULT 'medium',
  onboarding_status ENUM('pending','documents_submitted','approved','rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  active_status ENUM('active','inactive','suspended') DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4.2.3 users
Stores admin and AP user accounts.

```sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,        -- bcrypt hashed
  role ENUM('admin','accounts_payable','auditor') NOT NULL,
  buyer_id INT NULL,                          -- FK to buyers (for AP users)
  full_name VARCHAR(255),
  phone VARCHAR(50),
  active_status ENUM('active','inactive','locked') DEFAULT 'active',
  failed_login_attempts INT DEFAULT 0,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE SET NULL
);
```

#### 4.2.4 invoices
Stores AP invoice data uploaded from ERP.

```sql
CREATE TABLE invoices (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  supplier_id INT NOT NULL,
  
  -- ERP Fields
  company_code VARCHAR(20),
  vendor_number VARCHAR(50),
  document_number VARCHAR(100),
  document_type VARCHAR(10),
  document_date DATE,
  posting_date DATE,
  baseline_date DATE,
  net_due_date DATE,
  days_overdue INT,
  
  -- Invoice Core
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  amount_doc_curr DECIMAL(15,2),
  amount_local_curr DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'ZAR',
  
  -- Additional
  description TEXT,
  text_description TEXT,
  payment_terms VARCHAR(100),
  payment_method VARCHAR(50),
  assignment_po VARCHAR(100),
  reference_invoice VARCHAR(100),
  open_item VARCHAR(10),
  
  -- Status
  status ENUM('pending','matched','offered','accepted','paid','rejected') DEFAULT 'pending',
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
  UNIQUE KEY unique_invoice (buyer_id, invoice_number)
);
```

#### 4.2.5 offers
Stores early payment offers generated for suppliers.

```sql
CREATE TABLE offers (
  offer_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  supplier_id INT NOT NULL,
  buyer_id INT NOT NULL,
  
  -- Calculation Fields
  annual_rate DECIMAL(5,2) NOT NULL,          -- e.g., 12.50
  days_to_maturity INT NOT NULL,
  discount_amount DECIMAL(15,2) NOT NULL,     -- Calculated discount
  net_payment_amount DECIMAL(15,2) NOT NULL,  -- Amount supplier receives
  offer_expiry_date TIMESTAMP NOT NULL,
  
  -- Status
  status ENUM('sent','opened','accepted','rejected','expired') DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP NULL,
  responded_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id)
);
```

#### 4.2.6 payments
Stores payment disbursement records.

```sql
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  offer_id INT NOT NULL,
  supplier_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  payment_reference VARCHAR(100) UNIQUE,      -- e.g., "FMF1733123456789123"
  payment_method ENUM('eft','bank_transfer','other') DEFAULT 'eft',
  status ENUM('queued','processing','completed','failed','cancelled') DEFAULT 'queued',
  scheduled_date DATE,
  completed_date DATE NULL,
  batch_id VARCHAR(100),                      -- Groups payments for batch processing
  processed_by INT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (offer_id) REFERENCES offers(offer_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (processed_by) REFERENCES users(user_id)
);
```

#### 4.2.7 supplier_tokens
Manages secure access tokens for suppliers.

```sql
CREATE TABLE supplier_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,         -- 64-char hex string
  token_type ENUM('invite','approval','offer_access','reset_password') DEFAULT 'invite',
  expires_at TIMESTAMP NOT NULL,              -- 14 days from creation
  used_at TIMESTAMP NULL,                     -- Marks token as consumed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
);
```

**Token Types:**
| Type | Trigger | Purpose |
|------|---------|---------|
| `invite` | AP uploads new vendor | Initial cession agreement signing |
| `approval` | Admin approves supplier | Dashboard access after approval |
| `offer_access` | Offer generated | Direct access to view offers |

#### 4.2.8 cession_agreements
Stores signed cession agreement documents.

```sql
CREATE TABLE cession_agreements (
  cession_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  document_url VARCHAR(500),                  -- Azure Blob URL
  document_type ENUM('uploaded','digitally_signed') DEFAULT 'uploaded',
  version VARCHAR(20) DEFAULT '1.0',
  signed_date DATE,
  signature_data TEXT,                        -- Digital signature if applicable
  status ENUM('pending','signed','approved','rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id)
);
```

#### 4.2.9 audit_logs
Comprehensive activity logging for compliance.

```sql
CREATE TABLE audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_type ENUM('admin','accounts_payable','supplier','system') NOT NULL,
  action VARCHAR(255) NOT NULL,               -- e.g., "OFFER_ACCEPTED"
  entity_type VARCHAR(100),                   -- e.g., "offer"
  entity_id INT,
  details TEXT,                               -- JSON or descriptive text
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
```

### 4.3 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_suppliers_vendor_number ON suppliers(vendor_number);
CREATE INDEX idx_suppliers_company_code ON suppliers(company_code);
CREATE INDEX idx_invoices_vendor_number ON invoices(vendor_number);
CREATE INDEX idx_invoices_document_number ON invoices(document_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_supplier_id ON offers(supplier_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Methods

| User Type | Method | Session Duration |
|-----------|--------|------------------|
| **Admin** | Username + Password | 30 minutes |
| **AP User** | Mine Code + Password + OTP (2FA) | 30 minutes |
| **Supplier** | Token-based (email link) | 2 hours |

### 5.2 Session Management

**Implementation:** `lib/auth/session.ts`

```typescript
// Session data structure
interface SessionData {
  userId: number
  username: string
  email: string
  role: "admin" | "accounts_payable" | "auditor"
  buyerId?: number
  fullName?: string
  buyerName?: string
}

interface SupplierSessionData {
  supplierId: number
  email: string
  name: string
}
```

**JWT Configuration:**
- Algorithm: HS256
- Secret: Environment variable `JWT_SECRET`
- User sessions: 30 minutes
- Supplier sessions: 2 hours

### 5.3 Password Security

**Implementation:** `lib/auth/password.ts`

- Hashing: bcryptjs with automatic salt
- Minimum length: 8 characters (configurable)
- Comparison: Constant-time comparison to prevent timing attacks

### 5.4 Middleware Protection

**Implementation:** `middleware.ts`

```typescript
// Route protection matrix
const publicRoutes = ["/", "/landing", "/login/admin", "/login/ap", "/supplier/access"]

// Protected routes
/admin/*     → Requires admin role
/ap/*        → Requires accounts_payable role
/supplier/*  → Requires supplier session (except /supplier/access)
```

### 5.5 OTP (One-Time Password) Flow

**For AP Users:**

1. User enters mine code + password
2. System validates credentials
3. System generates 6-digit OTP
4. OTP stored in `otp_codes` table (10 min expiry)
5. Email sent via Azure Communication Services
6. User enters OTP
7. System validates and creates session

```sql
CREATE TABLE otp_codes (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## 6. Core Modules

### 6.1 Invoice Management Module

**Location:** `lib/actions/invoices.ts`

#### 6.1.1 CSV Parsing

**AP Data CSV Format:**
```
Company Code,Vendor Number,Vendor Name,Document Number,Document Type,
Document Date,Posting Date,Baseline Date,Net Due Date,Days Overdue,
Amount (Doc Curr),Currency,Amount (Local Curr),Payment Terms,
Payment Method,Assignment (PO #),Reference (Invoice #),Open Item,Text
```

**Vendor Data CSV Format:**
```
Company Code,Vendor Number,Vendor Name,Address,Contact Person,
Contact Email,Contact Phone,Bank Country,Bank Name,
Bank Key (Branch Code),Bank Account Number,IBAN,SWIFT/BIC,
Default Payment Method,Default Payment Terms,VAT Registration No,
Reconciliation G/L Account
```

#### 6.1.2 Key Functions

| Function | Purpose |
|----------|---------|
| `parseAPDataCSV(csvText)` | Parse AP invoice CSV into structured data |
| `parseVendorDataCSV(csvText)` | Parse vendor master CSV |
| `uploadAPData(rows)` | Insert invoices, match to suppliers |
| `uploadVendorData(rows)` | Insert/update suppliers, send invites |
| `getInvoicesForBuyer()` | Fetch invoices for AP user |
| `getAllInvoices()` | Fetch all invoices (admin) |

#### 6.1.3 Vendor Upload Flow

```
1. Parse CSV
2. For each vendor:
   a. Check if exists (by vendor_number + company_code)
   b. If exists → UPDATE details
   c. If new → INSERT supplier
3. For NEW suppliers only:
   a. Generate 64-char hex token
   b. Insert into supplier_tokens (type='invite', expires=14 days)
   c. Send welcome email via Azure Communication Services
4. Create audit log
5. Return results: { uploaded: [], errors: [], newSuppliers: [] }
```

#### 6.1.4 Invoice Upload Flow

```
1. Parse CSV
2. For each invoice (where Open Item = 'Yes'):
   a. Resolve buyer_id from company_code
   b. Resolve supplier_id from vendor_number + company_code
   c. Skip if supplier not found
   d. INSERT invoice with status='matched'
3. Create audit log
4. Auto-generate offers for eligible invoices
5. Return results: { uploaded: [], errors: [] }
```

### 6.2 Offer Generation Module

**Location:** `lib/actions/invoices.ts`

#### 6.2.1 Offer Calculation Formula

```typescript
// Get settings
const annualRate = 12.5  // From system_settings
const expiryDays = 7     // From system_settings

// Calculate
const daysToMaturity = (dueDate - today) / (1000 * 60 * 60 * 24)
const discountAmount = (invoiceAmount * annualRate * daysToMaturity) / (365 * 100)
const netPaymentAmount = invoiceAmount - discountAmount
const offerExpiryDate = today + expiryDays
```

**Example:**
- Invoice Amount: R 100,000
- Due Date: 60 days from now
- Annual Rate: 12.5%
- Discount: R 100,000 × 12.5% × 60 / 365 = R 2,054.79
- Net Payment: R 97,945.21

#### 6.2.2 Eligibility Criteria

An invoice is eligible for offer generation when:
1. `invoice.status = 'matched'`
2. `supplier.onboarding_status = 'approved'`
3. `invoice.due_date > NOW()` (not yet due)
4. No existing offer for this invoice

#### 6.2.3 Auto-Generation Triggers

| Trigger | Function | Scope |
|---------|----------|-------|
| AP uploads invoices | `autoGenerateOffersForEligibleInvoices()` | All eligible |
| Admin approves supplier | `autoGenerateOffersForSupplier(supplierId)` | Specific supplier |
| Manual (admin) | `generateOffers(invoiceIds)` | Selected invoices |

### 6.3 Supplier Management Module

**Location:** `lib/actions/suppliers.ts`

#### 6.3.1 Key Functions

| Function | Purpose |
|----------|---------|
| `getSupplierProfile()` | Get current supplier's profile |
| `getSupplierOffers()` | Get offers for current supplier |
| `acceptOffer(offerId)` | Accept an early payment offer |
| `rejectOffer(offerId)` | Reject an offer |
| `getSupplierPayments()` | Get payment history |
| `updateSupplierProfile(data)` | Update contact info |
| `requestBankChange(data)` | Submit bank change request |
| `uploadCessionAgreement(file)` | Upload signed cession PDF |
| `getSupplierCessionAgreement()` | Get cession status |

#### 6.3.2 Offer Acceptance Flow

```
1. Verify offer belongs to supplier
2. Check offer not already processed
3. Check offer not expired
4. Transaction:
   a. UPDATE offers SET status='accepted', responded_at=NOW()
   b. UPDATE invoices SET status='accepted'
5. Create audit log
6. Return success
```

### 6.4 Admin Module

**Location:** `lib/actions/admin.ts`

#### 6.4.1 Dashboard Metrics

```typescript
interface DashboardMetrics {
  pendingDocuments: number      // Cession agreements pending review
  totalApplications: number     // Suppliers in onboarding
  registeredSuppliers: number   // Approved suppliers
  paymentsIssued48h: number     // Payment value in last 48 hours
}
```

#### 6.4.2 Supplier Approval Flow

```
1. Admin reviews supplier application
2. Admin reviews cession agreement
3. Admin clicks "Approve":
   a. UPDATE suppliers SET onboarding_status='approved'
   b. Auto-generate offers for supplier's matched invoices
   c. Generate new 'approval' token (64-char hex)
   d. INSERT into supplier_tokens
   e. Send approval email with dashboard access link
4. Supplier receives email with access link
5. Supplier clicks link → token validated → session created
```

### 6.5 Payment Module

**Location:** `lib/actions/payments.ts`

#### 6.5.1 Payment Queue

Shows accepted offers ready for disbursement:
- Offer status = 'accepted'
- No existing payment record

#### 6.5.2 Payment Processing Flow

```
1. Admin selects offers from queue
2. queuePayments(offerIds):
   a. For each offer:
      - Generate payment reference: FMF{timestamp}{offerId}
      - INSERT payment (status='queued')
      - INSERT repayment (buyer obligation)
3. generatePaymentBatch(paymentIds):
   a. Update payments to 'processing'
   b. Assign batch_id
   c. Generate CSV for bank upload
4. After bank confirms:
   a. Update payments to 'completed'
   b. Update repayments with received amounts
```

#### 6.5.3 Payment Batch CSV Format

```csv
Payment Reference,Beneficiary Name,Bank Name,Account Number,Branch Code,Account Type,Amount
FMF1733123456789123,Acme Supplies,First National Bank,62123456789,250655,current,97945.21
```

### 6.6 Reports Module

**Location:** `lib/actions/reports.ts`

#### 6.6.1 Available Reports

| Report | Description |
|--------|-------------|
| **Offer Acceptance Summary** | Daily/weekly acceptance rates by buyer/supplier |
| **Disbursement Tracker** | Payment status, batch tracking |
| **Supplier Status Report** | Onboarding status, offer counts, total disbursed |
| **Audit History** | Filterable activity logs |

#### 6.6.2 Report Filters

```typescript
interface ReportFilters {
  startDate?: string
  endDate?: string
  buyerId?: number
  supplierId?: number
  status?: string
  limit?: number
}
```

---

## 7. API Reference

### 7.1 Authentication Endpoints

#### POST /api/auth/login/admin
Admin password authentication.

**Request:**
```json
{
  "username": "admin",
  "password": "********"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "userId": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

#### POST /api/auth/login/ap
AP user authentication (initiates OTP flow).

**Request:**
```json
{
  "mineCode": "AAP001",
  "password": "********"
}
```

**Response:**
```json
{
  "success": true,
  "userId": 2,
  "email": "a***@mine.com",
  "message": "OTP sent to email"
}
```

#### POST /api/auth/verify-otp
Verify OTP and create session.

**Request:**
```json
{
  "userId": 2,
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/auth/supplier/verify-token
Supplier token authentication.

**Request:**
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "supplier": {
    "supplierId": 1,
    "name": "Acme Supplies",
    "email": "contact@acme.com",
    "onboardingStatus": "approved"
  }
}
```

### 7.2 Data Endpoints

#### GET /api/invoices
Fetch invoices for current AP user.

**Response:**
```json
[
  {
    "invoice_id": 1,
    "document_number": "19000300",
    "vendor_number": "200016",
    "supplier_name": "Shosholoza Logistics",
    "amount_doc_curr": 9303.57,
    "currency": "ZAR",
    "due_date": "2025-10-24",
    "status": "matched",
    "offer_count": 0
  }
]
```

#### GET /api/session
Get current session information.

**Response:**
```json
{
  "userId": 1,
  "username": "admin",
  "email": "admin@fmf.com",
  "role": "admin",
  "fullName": "John Admin"
}
```

#### GET /api/cession-agreement/template?supplierId={id}
Generate cession agreement PDF template.

**Response:** PDF file download

### 7.3 Server Actions

Server Actions are called directly from React components, not via HTTP:

```typescript
// Example usage in component
import { getSupplierOffers, acceptOffer } from "@/lib/actions/suppliers"

// In component
const offers = await getSupplierOffers()
const result = await acceptOffer(offerId, [])
```

---

## 8. Email Service

### 8.1 Azure Communication Services Configuration

**Location:** `lib/services/email.ts`

```typescript
// Configuration
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING
const senderAddress = process.env.AZURE_COMMUNICATION_SENDER
// Default: "DoNotReply@ccd12bc5-9970-4050-8117-1aec566c8db9.azurecomm.net"
```

### 8.2 Email Templates

#### 8.2.1 OTP Email
- **Subject:** "Your OTP for Future Cashflow Platform"
- **Trigger:** AP user login
- **Expiry:** 10 minutes
- **Content:** 6-digit code with branded HTML template

#### 8.2.2 Supplier Welcome Email
- **Subject:** "Action Required: Sign Your Cession Agreement - Future Cashflow"
- **Trigger:** New vendor uploaded by AP
- **Token Expiry:** 14 days
- **Content:** 
  - Welcome message
  - Steps to complete onboarding
  - "Sign Cession Agreement" button with access link

#### 8.2.3 Supplier Approval Email
- **Subject:** "🎉 Your Application Has Been Approved - Future Cashflow"
- **Trigger:** Admin approves supplier
- **Token Expiry:** 14 days
- **Content:**
  - Approval confirmation
  - Features available (view offers, accept payments)
  - "Access Your Dashboard" button with access link

### 8.3 Email Sending Flow

```typescript
async function sendEmail(message): Promise<boolean> {
  const client = new EmailClient(connectionString)
  const poller = await client.beginSend(message)
  const result = await poller.pollUntilDone()
  return result.status === KnownEmailSendStatus.Succeeded
}
```

---

## 9. File Storage

### 9.1 Azure Blob Storage Configuration

**Location:** `lib/services/blob-storage.ts`

```typescript
// Configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "cession-agreements"
```

### 9.2 Container Structure

```
fmscfplatformstorage
└── cession-agreements/
    ├── 1-1733123456789-uuid-agreement.pdf
    ├── 2-1733123457890-uuid-cession.pdf
    └── ...
```

**Naming Convention:**
```
{supplier_id}-{timestamp}-{uuid}-{original_filename}
```

### 9.3 Upload Flow

```typescript
async function uploadToBlobStorage(file: Buffer, fileName: string, supplierId: number): Promise<string> {
  // 1. Get or create container
  const container = await getContainerClient()
  
  // 2. Generate unique blob name
  const uniqueName = `${supplierId}-${Date.now()}-${randomUUID()}-${fileName}`
  
  // 3. Upload with content type
  await blockBlobClient.upload(file, file.length, {
    blobHTTPHeaders: { blobContentType: "application/pdf" }
  })
  
  // 4. Return public URL
  return blockBlobClient.url
}
```

### 9.4 Fallback (Development)

When Blob Storage is not configured, files are stored locally:
```
public/uploads/cession-agreements/{uniqueName}
```

---

## 10. Deployment & Infrastructure

### 10.1 Azure Resources

| Resource | Name | SKU/Tier | Region |
|----------|------|----------|--------|
| **Resource Group** | fm-rg-dev-san | - | South Africa North |
| **App Service Plan** | fm-asp-dev-san | B1 (Basic) | South Africa North |
| **Web App** | fm-asp-dev-san | Linux Node 20 | South Africa North |
| **MySQL Flexible Server** | futurefinancecashflow | Burstable B1ms | South Africa North |
| **Storage Account** | fmscfplatformstorage | Standard LRS | South Africa North |
| **Communication Services** | fm-acs-dev-san | - | Global |

### 10.2 CI/CD Pipeline

**Location:** `azure-pipelines.yml`

```yaml
trigger:
- master

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'connectionservice'
  webAppName: 'fm-asp-dev-san'
  resourceGroupName: 'fm-rg-dev-san'

stages:
- stage: Build
  jobs:
  - job: BuildJob
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '20.x'
    
    - script: |
        npm install --legacy-peer-deps
        npm run build
      env:
        NODE_ENV: production
    
    - script: npm ci --production --legacy-peer-deps
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(Build.ArtifactStagingDirectory)/deploy'
        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
    
    - publish: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
      artifact: drop

- stage: Deploy
  dependsOn: Build
  jobs:
  - deployment: DeploymentJob
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webAppLinux'
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
              runtimeStack: 'NODE|20-lts'
              startUpCommand: 'node server.js'
```

### 10.3 Custom Server

**Location:** `server.js`

The application uses a custom Node.js server for Azure App Service compatibility:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.WEBSITE_HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

### 10.4 Build Configuration

**Location:** `next.config.mjs`

```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // For rapid deployment
  },
  images: {
    unoptimized: true,        // Static export compatibility
  },
  env: {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_PORT: process.env.DB_PORT,
    JWT_SECRET: process.env.JWT_SECRET,
  },
}
```

### 10.5 Deployment Checklist

```
□ 1. Ensure all environment variables set in Azure App Service
□ 2. Verify MySQL firewall allows Azure services
□ 3. Confirm Blob Storage container exists with public blob access
□ 4. Test Azure Communication Services email domain verification
□ 5. Run database migrations (scripts/01-create-database-schema.sql)
□ 6. Seed initial data (scripts/02-seed-initial-data.sql)
□ 7. Create admin user (python create_admin.py)
□ 8. Create AP user (python create_buyer.py)
□ 9. Push to master branch to trigger pipeline
□ 10. Verify health endpoint: /api/health
```

---

## 11. Security Considerations

### 11.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| **Password Hashing** | bcryptjs with automatic salt generation |
| **Session Tokens** | JWT with HS256, short expiry (30 min) |
| **2FA for AP Users** | Email OTP with 10-minute expiry |
| **Supplier Access** | One-time use tokens, 14-day expiry |
| **Failed Login Tracking** | Counter in users table, lockout after 5 attempts |

### 11.2 Data Protection

| Measure | Implementation |
|---------|----------------|
| **Transport Security** | HTTPS enforced by Azure App Service |
| **Database Security** | SSL/TLS 1.2 required for MySQL connections |
| **Sensitive Data** | Password hashes only, no plaintext storage |
| **Session Cookies** | HttpOnly, Secure, SameSite=Lax |

### 11.3 Cookie Configuration

```typescript
// Session cookie settings
{
  httpOnly: true,           // Prevents XSS access
  secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
  sameSite: "lax",          // CSRF protection
  maxAge: 60 * 30,          // 30 minutes
  path: "/",
}
```

### 11.4 Input Validation

| Area | Validation |
|------|------------|
| **CSV Upload** | Row-by-row parsing with error collection |
| **Email Addresses** | Format validation before sending |
| **Numeric Fields** | parseFloat/parseInt with NaN checks |
| **Dates** | ISO format validation |
| **File Uploads** | PDF content-type validation |

### 11.5 SQL Injection Prevention

All database queries use parameterized statements:

```typescript
// Safe - parameterized query
const [results] = await connection.execute(
  `SELECT * FROM suppliers WHERE vendor_number = ? AND company_code = ?`,
  [vendorNumber, companyCode]
)

// NEVER do this
// const results = await query(`SELECT * FROM suppliers WHERE vendor_number = '${vendorNumber}'`)
```

### 11.6 Audit Trail

All significant actions are logged to `audit_logs`:

```typescript
await createAuditLog({
  userId: session.userId,
  userType: "admin",
  action: "SUPPLIER_APPROVED",
  entityType: "supplier",
  entityId: supplierId,
  details: `Approved supplier ${supplierName}`,
  ipAddress: request.headers.get("x-forwarded-for"),
  userAgent: request.headers.get("user-agent"),
})
```

**Logged Actions:**
- `ADMIN_LOGIN_SUCCESS` / `ADMIN_LOGIN_FAILED`
- `AP_LOGIN_SUCCESS` / `AP_LOGIN_FAILED`
- `SUPPLIER_LOGIN_SUCCESS`
- `VENDOR_DATA_UPLOADED`
- `AP_DATA_UPLOADED`
- `SUPPLIER_APPROVED` / `SUPPLIER_REJECTED`
- `CESSION_APPROVED` / `CESSION_REJECTED`
- `OFFERS_GENERATED` / `AUTO_OFFERS_GENERATED`
- `OFFER_ACCEPTED` / `OFFER_REJECTED`
- `PAYMENTS_QUEUED`
- `PAYMENT_BATCH_GENERATED`
- `PROFILE_UPDATED`
- `BANK_CHANGE_REQUESTED`

---

## 12. Error Handling

### 12.1 Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| **API Routes** | Try-catch with NextResponse.json error |
| **Server Actions** | Try-catch with thrown errors |
| **Database** | Connection retry, transaction rollback |
| **Email Service** | Return boolean, log errors |
| **File Storage** | Throw errors, catch in caller |

### 12.2 API Error Response Format

```typescript
// Standard error response
NextResponse.json(
  { error: "Descriptive error message" },
  { status: 400 | 401 | 404 | 500 }
)

// Example responses
{ error: "Token is required" }           // 400
{ error: "Invalid or expired token" }    // 401
{ error: "Supplier not found" }          // 404
{ error: "Internal server error" }       // 500
```

### 12.3 Database Error Handling

```typescript
try {
  const results = await transaction(async (connection) => {
    // Database operations
    return { success: true }
  })
} catch (error: any) {
  if (error.code === "ER_DUP_ENTRY") {
    errors.push(`${row["Document Number"]}: Duplicate invoice`)
  } else {
    errors.push(`${row["Document Number"]}: ${error.message}`)
  }
}
```

### 12.4 Common Error Codes

| MySQL Error Code | Meaning | Handling |
|------------------|---------|----------|
| `ER_DUP_ENTRY` | Unique constraint violation | Report duplicate |
| `ER_NO_REFERENCED_ROW` | Foreign key violation | Report missing reference |
| `ER_LOCK_WAIT_TIMEOUT` | Transaction timeout | Retry |
| `ECONNREFUSED` | Database unreachable | Log, return 500 |

### 12.5 Client-Side Error Display

```typescript
// Using Sonner toast notifications
import { toast } from "sonner"

try {
  const result = await uploadAPData(rows)
  toast.success(`Uploaded ${result.uploaded.length} invoices`)
} catch (error: any) {
  toast.error(error.message || "Failed to upload invoices")
}
```

---

## 13. Environment Configuration

### 13.1 Environment Variables

**Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL server hostname | `futurefinancecashflow.mysql.database.azure.com` |
| `DB_NAME` | Database name | `fmf_scf_platform` |
| `DB_USER` | Database username | `FMadmin` |
| `DB_PASSWORD` | Database password | `********` |
| `DB_PORT` | MySQL port | `3306` |
| `JWT_SECRET` | Secret for JWT signing | `REDACTED_JWT_SECRET` |
| `NEXTAUTH_URL` | Base URL of application | `https://fm-asp-dev-san-...azurewebsites.net` |

**Azure Services:**

| Variable | Description |
|----------|-------------|
| `AZURE_COMMUNICATION_CONNECTION_STRING` | Azure Communication Services connection |
| `AZURE_COMMUNICATION_SENDER` | Email sender address |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection |
| `AZURE_STORAGE_CONTAINER_NAME` | Container for cession agreements |

### 13.2 Local Development (.env)

```bash
# Database
DB_HOST=localhost
DB_NAME=fmf_scf_platform
DB_USER=root
DB_PASSWORD=your_local_password
DB_PORT=3306

# Authentication
JWT_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Azure Services (optional for local dev)
# AZURE_COMMUNICATION_CONNECTION_STRING=
# AZURE_STORAGE_CONNECTION_STRING=
```

### 13.3 Production Configuration (Azure App Service)

Set via Azure Portal → App Service → Configuration → Application settings:

```json
{
  "DB_HOST": "futurefinancecashflow.mysql.database.azure.com",
  "DB_NAME": "fmf_scf_platform",
  "DB_USER": "FMadmin",
  "DB_PASSWORD": "********",
  "DB_PORT": "3306",
  "JWT_SECRET": "REDACTED_JWT_SECRET",
  "NODE_ENV": "production",
  "NEXTAUTH_URL": "https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net",
  "AZURE_COMMUNICATION_CONNECTION_STRING": "endpoint=https://fm-acs-dev-san.africa.communication.azure.com/;accesskey=...",
  "AZURE_COMMUNICATION_SENDER": "DoNotReply@ccd12bc5-9970-4050-8117-1aec566c8db9.azurecomm.net"
}
```

### 13.4 Database Connection Configuration

```typescript
// lib/db.ts
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "fmf_scf_platform",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL for Azure MySQL
  ...(process.env.DB_HOST?.includes('azure.com') && {
    ssl: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  }),
}
```

---

## 14. System Settings

### 14.1 Configurable Settings

Stored in `system_settings` table:

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `platform_name` | Future Cashflow | Display name |
| `support_email` | support@fmfscf.com | Support contact |
| `support_phone` | +27 11 123 4567 | Support phone |
| `default_currency` | ZAR | Transaction currency |
| `default_annual_rate` | 12.50 | Discount rate % |
| `offer_expiry_days` | 7 | Days until offer expires |
| `min_invoice_amount` | 1000.00 | Minimum invoice value |
| `max_invoice_amount` | 10000000.00 | Maximum invoice value |
| `session_timeout_minutes` | 30 | Session duration |
| `max_login_attempts` | 5 | Before account lock |
| `password_min_length` | 8 | Minimum password length |
| `email_notifications_enabled` | true | Email sending enabled |
| `maintenance_mode` | false | Platform maintenance |

### 14.2 Settings Management

```typescript
// Get all settings
const settings = await getSystemSettings()

// Update a setting
await updateSystemSetting("default_annual_rate", "15.00")

// Get specific setting with default
const rate = await getSettingValue("default_annual_rate", "12.50")
```

---

## 15. Monitoring & Logging

### 15.1 Application Logging

All significant events are logged to console with prefixes:

```typescript
console.log(`[v0] Created invite token for supplier ${supplierId}`)
console.log(`[Email Service] OTP email sent successfully to ${email}`)
console.log(`[Blob Storage] Uploaded: ${uniqueName}`)
console.error(`[v0] Error fetching dashboard metrics:`, error)
```

### 15.2 Log Prefixes

| Prefix | Source |
|--------|--------|
| `[v0]` | Core application logic |
| `[Email Service]` | Azure Communication Services |
| `[Blob Storage]` | Azure Blob Storage |
| `[Admin]` | Admin-specific actions |
| `[Cession]` | Cession agreement processing |

### 15.3 Azure App Service Logs

Access via Azure Portal → App Service → Monitoring → Log stream

Or via Azure CLI:
```bash
az webapp log tail --name fm-asp-dev-san --resource-group fm-rg-dev-san
```

### 15.4 Audit Log Queries

```sql
-- Recent activity
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- Failed logins
SELECT * FROM audit_logs 
WHERE action LIKE '%LOGIN_FAILED%'
ORDER BY created_at DESC;

-- Supplier actions
SELECT * FROM audit_logs 
WHERE user_type = 'supplier'
ORDER BY created_at DESC;

-- Actions by specific user
SELECT * FROM audit_logs 
WHERE user_id = 1
ORDER BY created_at DESC;
```

---

## 16. Troubleshooting Guide

### 16.1 Common Issues

#### Database Connection Failures

**Symptom:** Application returns 500 errors, logs show `ECONNREFUSED`

**Solutions:**
1. Verify MySQL server is running
2. Check firewall rules allow Azure services
3. Verify SSL certificate is valid
4. Check connection string credentials

```sql
-- Test connection manually
mysql -h futurefinancecashflow.mysql.database.azure.com \
      -u FMadmin -p \
      --ssl-mode=REQUIRED
```

#### Email Not Sending

**Symptom:** Suppliers don't receive invitation emails

**Solutions:**
1. Verify `AZURE_COMMUNICATION_CONNECTION_STRING` is set
2. Check sender domain is verified in Azure
3. Review Azure Communication Services logs
4. Check recipient email is valid

```typescript
// Test email configuration
if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
  console.error("Email not configured - connection string missing")
}
```

#### Offers Not Generating

**Symptom:** Approved suppliers don't see offers

**Checklist:**
1. ✓ Supplier `onboarding_status` = 'approved'
2. ✓ Invoices exist for supplier's `vendor_number`
3. ✓ Invoice `status` = 'matched'
4. ✓ Invoice `due_date` > current date
5. ✓ No existing offer for invoice

```sql
-- Debug query
SELECT i.invoice_id, i.status, i.due_date, s.onboarding_status,
       (SELECT COUNT(*) FROM offers o WHERE o.invoice_id = i.invoice_id) as offer_count
FROM invoices i
JOIN suppliers s ON i.vendor_number = s.vendor_number
WHERE s.supplier_id = ?;
```

#### Token Verification Fails

**Symptom:** Suppliers get "Invalid or expired token" error

**Checklist:**
1. ✓ Token exists in `supplier_tokens`
2. ✓ Token `used_at` is NULL
3. ✓ Token `expires_at` > current time
4. ✓ Token matches exactly (case-sensitive)

```sql
-- Check token status
SELECT * FROM supplier_tokens 
WHERE token = 'xxxxx'
OR supplier_id = ?;
```

#### Decimal Display Issues

**Symptom:** Numbers show as "R 0123456.78" with leading zero

**Cause:** MySQL Decimal type returns as string in JavaScript

**Solution:**
```typescript
// Wrong
const total = values.reduce((sum, v) => sum + Number(v.amount), 0)

// Correct
const total = values.reduce((sum, v) => sum + parseFloat(String(v.amount)) || 0, 0)
```

### 16.2 Health Check Endpoint

**Location:** `/api/health`

```typescript
export async function GET() {
  try {
    await testConnection()
    return NextResponse.json({ status: "healthy", database: "connected" })
  } catch (error) {
    return NextResponse.json({ status: "unhealthy", error: error.message }, { status: 500 })
  }
}
```

---

## 17. Development Guidelines

### 17.1 Project Structure

```
scf-platform/
├── app/                      # Next.js App Router
│   ├── (public)/            # Public routes group
│   ├── admin/               # Admin pages
│   ├── ap/                  # AP user pages
│   ├── api/                 # API routes
│   ├── login/               # Login pages
│   ├── supplier/            # Supplier pages
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/               # React components
│   ├── admin/               # Admin-specific components
│   ├── supplier/            # Supplier-specific components
│   └── ui/                  # shadcn/ui components
├── hooks/                    # Custom React hooks
├── lib/                      # Core libraries
│   ├── actions/             # Server actions
│   ├── auth/                # Authentication utilities
│   ├── constants/           # Constants and config
│   ├── services/            # External service integrations
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── db.ts                # Database connection
│   └── utils.ts             # Common utilities
├── public/                   # Static assets
├── scripts/                  # SQL scripts
├── styles/                   # Additional styles
├── middleware.ts             # Next.js middleware
├── next.config.mjs           # Next.js config
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind config
└── tsconfig.json             # TypeScript config
```

### 17.2 Coding Standards

#### TypeScript

```typescript
// Use explicit types
interface SupplierData {
  supplierId: number
  name: string
  email: string
}

// Use async/await
async function fetchSupplier(id: number): Promise<SupplierData | null> {
  try {
    const results = await query<SupplierData[]>(
      `SELECT * FROM suppliers WHERE supplier_id = ?`,
      [id]
    )
    return results[0] || null
  } catch (error) {
    console.error("[v0] Error fetching supplier:", error)
    throw error
  }
}
```

#### React Components

```tsx
// Server Component (default)
export default async function SupplierDashboard() {
  const profile = await getSupplierProfile()
  return <div>{profile.name}</div>
}

// Client Component (when needed)
"use client"
export default function InteractiveForm() {
  const [value, setValue] = useState("")
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

#### Database Queries

```typescript
// Always use parameterized queries
await query(
  `INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)`,
  [userId, action, details]
)

// Use transactions for multi-step operations
await transaction(async (connection) => {
  await connection.execute(`UPDATE offers SET status = ? WHERE offer_id = ?`, ['accepted', offerId])
  await connection.execute(`UPDATE invoices SET status = ? WHERE invoice_id = ?`, ['accepted', invoiceId])
})
```

### 17.3 Adding New Features

#### New Server Action

1. Create function in appropriate `lib/actions/*.ts` file
2. Add `"use server"` directive at top of file
3. Check session/authorization
4. Implement database logic
5. Add audit logging
6. Handle errors appropriately

```typescript
"use server"

export async function newFeature(params: NewFeatureParams) {
  // 1. Authorization
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized")
  }

  try {
    // 2. Business logic
    const result = await query(...)

    // 3. Audit log
    await createAuditLog({
      userId: session.userId,
      userType: "admin",
      action: "NEW_FEATURE_USED",
      details: JSON.stringify(params),
    })

    return result
  } catch (error) {
    console.error("[v0] Error in newFeature:", error)
    throw error
  }
}
```

#### New API Route

1. Create `route.ts` in `app/api/{path}/`
2. Export HTTP method handlers (GET, POST, etc.)
3. Parse request body/params
4. Call server action or database
5. Return appropriate response

```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    if (!body.requiredField) {
      return NextResponse.json({ error: "requiredField is required" }, { status: 400 })
    }

    // Logic
    const result = await someAction(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### 17.4 Testing

#### Manual Testing Checklist

```
Admin Flow:
□ Login with username/password
□ View dashboard metrics
□ Review pending cession agreements
□ Approve/reject supplier
□ View payment queue
□ Generate payment batch

AP Flow:
□ Login with mine code + password + OTP
□ Upload vendor CSV
□ Upload AP invoice CSV
□ View uploaded invoices

Supplier Flow:
□ Access via email link (token)
□ Upload cession agreement
□ View pending offers
□ Accept/reject offer
□ View payment history
```

#### Database Test Queries

```sql
-- Verify data integrity
SELECT COUNT(*) FROM suppliers WHERE onboarding_status = 'approved';
SELECT COUNT(*) FROM invoices WHERE status = 'matched';
SELECT COUNT(*) FROM offers WHERE status = 'sent';
SELECT COUNT(*) FROM payments WHERE status = 'queued';

-- Check for orphaned records
SELECT i.* FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
WHERE s.supplier_id IS NULL;
```

---

## 18. Appendix

### 18.1 Sample CSV Files

#### Vendor Upload CSV
```csv
Company Code,Vendor Number,Vendor Name,Address,Contact Person,Contact Email,Contact Phone,Bank Country,Bank Name,Bank Key (Branch Code),Bank Account Number,IBAN,SWIFT/BIC,Default Payment Method,Default Payment Terms,VAT Registration No,Reconciliation G/L Account
1000,200008,Marumo Construction,707 Main Rd Rustenburg,Palesa Mahlangu,info@marumo-construction.co.za,+27 780 450 9862,ZA,First National Bank,250655,8166292195,,FIRNZAJJ,T (EFT),0002 (45 days),4673016401,200000
2000,200016,Shosholoza Logistics,Plot 12 Industrial Park,James Mokoena,accounts@shosholoza.co.za,+27 72 234 5678,ZA,Standard Bank,051001,9876543210,,SBZAZAJJ,T (EFT),0003 (60 days),4890123456,200000
```

#### AP Invoice Upload CSV
```csv
Company Code,Vendor Number,Vendor Name,Document Number,Document Type,Document Date,Posting Date,Baseline Date,Net Due Date,Days Overdue,Amount (Doc Curr),Currency,Amount (Local Curr),Payment Terms,Payment Method,Assignment (PO #),Reference (Invoice #),Open Item,Text
2000,200016,Shosholoza Logistics,19000300,KR,2025-08-25,2025-08-25,2025-08-25,2025-10-24,-64,9303.57,ZAR,9303.57,0003 (60 days),T (EFT),PO2100,INV-3100,Yes,Transport services August
1000,200008,Marumo Construction,19000301,KR,2025-08-20,2025-08-20,2025-08-20,2025-10-04,-84,125000.00,ZAR,125000.00,0002 (45 days),T (EFT),PO1050,INV-1050,Yes,Construction Phase 2
```

### 18.2 Database Migration Scripts

**Location:** `scripts/`

| Script | Purpose |
|--------|---------|
| `01-create-database-schema.sql` | Create all tables |
| `02-seed-initial-data.sql` | Insert system settings |
| `03-update-schema-for-ap-data.sql` | Add ERP-specific columns |

### 18.3 Python Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `create_admin.py` | Create admin user | `python create_admin.py` |
| `create_buyer.py` | Create AP user | `python create_buyer.py` |
| `create_supplier_tokens.py` | Generate supplier tokens | `python create_supplier_tokens.py` |
| `check_db.py` | Test database connection | `python check_db.py` |
| `check_vendors.py` | List suppliers | `python check_vendors.py` |

### 18.4 Useful SQL Queries

```sql
-- Dashboard summary
SELECT 
  (SELECT COUNT(*) FROM suppliers WHERE onboarding_status = 'approved') as approved_suppliers,
  (SELECT COUNT(*) FROM invoices WHERE status = 'matched') as matched_invoices,
  (SELECT COUNT(*) FROM offers WHERE status = 'sent') as pending_offers,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_disbursed;

-- Supplier pipeline
SELECT onboarding_status, COUNT(*) as count
FROM suppliers
GROUP BY onboarding_status;

-- Offer conversion rate
SELECT 
  COUNT(*) as total_offers,
  SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
  ROUND(SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as acceptance_rate
FROM offers
WHERE status IN ('accepted', 'rejected');

-- Top suppliers by disbursement
SELECT s.name, SUM(p.amount) as total_received
FROM payments p
JOIN suppliers s ON p.supplier_id = s.supplier_id
WHERE p.status = 'completed'
GROUP BY s.supplier_id, s.name
ORDER BY total_received DESC
LIMIT 10;
```

---

## 19. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | December 3, 2025 | Initial release |

---

## 20. Contact & Support

| Role | Contact |
|------|---------|
| **Platform Owner** | Future Mining Finance (Pty) Ltd |
| **Technical Support** | support@fmfscf.com |
| **Development Team** | Ongoti Dev |

---

**Document End**

*© 2025 Future Cashflow. All rights reserved.*
*Registered Credit Provider NCRCP18174*
