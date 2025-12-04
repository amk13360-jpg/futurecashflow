# Future Cashflow - Developer Onboarding Guide
## Supply Chain Finance Platform

**Version:** 1.0.0  
**Last Updated:** December 3, 2025  
**Audience:** New Developers, Contributors

---

## Welcome! 👋

Welcome to the Future Cashflow development team! This guide will help you get up and running with the SCF Platform codebase quickly and efficiently.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Prerequisites](#2-prerequisites)
3. [Development Environment Setup](#3-development-environment-setup)
4. [Project Structure](#4-project-structure)
5. [Development Workflow](#5-development-workflow)
6. [Coding Standards](#6-coding-standards)
7. [Testing Guidelines](#7-testing-guidelines)
8. [Database Development](#8-database-development)
9. [Common Development Tasks](#9-common-development-tasks)
10. [Troubleshooting](#10-troubleshooting)
11. [Resources & Documentation](#11-resources--documentation)

---

## 1. Quick Start

### TL;DR - Get Running in 5 Minutes

```powershell
# 1. Clone the repository
git clone https://dev.azure.com/yourorg/FutureMining/_git/scf-platform
cd scf-platform

# 2. Install dependencies
npm install --legacy-peer-deps
# Or use pnpm
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see section 3.3)

# 4. Set up local MySQL database
# Run scripts/01-create-database-schema.sql
# Run scripts/02-seed-initial-data.sql

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default Login Credentials:**
- **Admin:** `admin01` / `Mining@2025`
- **AP User:** `ap01` / `APUser@2025` (requires OTP from database)

---

## 2. Prerequisites

### 2.1 Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20.x LTS | JavaScript runtime |
| **npm** or **pnpm** | Latest | Package manager |
| **MySQL** | 8.0+ | Database (local or Docker) |
| **Git** | Latest | Version control |
| **VS Code** | Latest | Recommended IDE |

### 2.2 Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-azuretools.vscode-cosmosdb",
    "prisma.prisma",
    "mtxr.sqltools",
    "mtxr.sqltools-driver-mysql"
  ]
}
```

### 2.3 Optional Tools

| Tool | Purpose |
|------|---------|
| **Docker Desktop** | Run MySQL in container |
| **Azure CLI** | Deploy and manage Azure resources |
| **Azure Data Studio** | Database management |
| **Postman/Insomnia** | API testing |

---

## 3. Development Environment Setup

### 3.1 Clone the Repository

```powershell
# HTTPS
git clone https://dev.azure.com/yourorg/FutureMining/_git/scf-platform

# Navigate to project
cd scf-platform
```

### 3.2 Install Dependencies

```powershell
# Using npm (recommended for compatibility)
npm install --legacy-peer-deps

# Or using pnpm
pnpm install
```

> **Note:** We use `--legacy-peer-deps` due to React 19 peer dependency resolution.

### 3.3 Environment Configuration

Create a `.env.local` file in the project root:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=fmf_scf_platform

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-development-secret-key-min-32-chars

# ===========================================
# AZURE SERVICES (Optional for local dev)
# ===========================================
# Email Service - Leave empty to skip email sending
AZURE_COMMUNICATION_CONNECTION_STRING=
AZURE_COMMUNICATION_SENDER=

# Blob Storage - Leave empty to use local storage
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=cession-agreements

# ===========================================
# APPLICATION
# ===========================================
BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 3.4 Database Setup

#### Option A: Local MySQL Installation

1. Install MySQL 8.0
2. Create database:

```sql
CREATE DATABASE fmf_scf_platform;
USE fmf_scf_platform;
```

3. Run schema scripts:

```powershell
# From project root
mysql -u root -p fmf_scf_platform < scripts/01-create-database-schema.sql
mysql -u root -p fmf_scf_platform < scripts/02-seed-initial-data.sql
```

#### Option B: Docker MySQL

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: fmf_scf_platform
    ports:
      - "3306:3306"
    volumes:
      - ./scripts:/docker-entrypoint-initdb.d
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

```powershell
docker-compose up -d
```

### 3.5 Verify Installation

```powershell
# Start development server
npm run dev

# Should see:
# ▲ Next.js 16.0.0
# - Local: http://localhost:3000
```

Visit:
- http://localhost:3000 - Landing page
- http://localhost:3000/login/admin - Admin login
- http://localhost:3000/login/ap - AP login

---

## 4. Project Structure

### 4.1 Directory Overview

```
scf-platform/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes (no auth)
│   │   ├── landing/       # Landing page
│   │   └── layout.tsx     # Public layout
│   ├── admin/             # Admin dashboard routes
│   │   ├── dashboard/
│   │   ├── applications/
│   │   ├── bank-changes/  # Bank change request approvals
│   │   ├── documents/
│   │   ├── invoices/
│   │   ├── offer-batches/ # Batch offer management
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── settings/      # System settings + User management
│   │   ├── suppliers/
│   │   └── vendors/
│   ├── ap/                # Accounts Payable routes
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── reports/
│   │   └── vendors/
│   ├── supplier/          # Supplier portal routes
│   │   ├── access/        # Token verification
│   │   ├── cession-agreement/  # Cession signing + Standing cession
│   │   ├── dashboard/
│   │   └── offers/        # View/accept offers (single & multi-select)
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── suppliers/
│   │   └── cession-agreement/
│   ├── login/             # Login pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   ├── supplier/         # Supplier-specific components
│   └── theme-*.tsx       # Theme components
│
├── lib/                  # Core library code
│   ├── actions/          # Server Actions
│   │   ├── admin.ts        # Admin ops, bank change approve/reject
│   │   ├── invoices.ts     # Invoice CRUD
│   │   ├── offer-batches.ts # Batch offer creation & management
│   │   ├── payments.ts     # Payment processing
│   │   ├── reports.ts      # Report generation
│   │   ├── settings.ts     # System settings
│   │   ├── standing-cession.ts # Standing cession & addendums
│   │   ├── suppliers.ts    # Supplier ops, multi-offer accept
│   │   └── users.ts        # User CRUD for admin
│   ├── auth/             # Authentication utilities
│   │   ├── session.ts    # JWT session management
│   │   ├── password.ts   # Password hashing
│   │   └── audit.ts      # Audit logging
│   ├── services/         # External services
│   │   ├── email.ts      # Azure email service
│   │   └── blob-storage.ts
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   │   └── index.ts      # Includes generateToken, generateShortCode
│   └── db.ts             # Database connection
│
├── scripts/              # Database scripts
│   ├── 01-create-database-schema.sql
│   ├── 02-seed-initial-data.sql
│   ├── 03-update-schema-for-ap-data.sql
│   └── 04-phase1-schema-updates.sql  # New tables & columns
│
├── public/               # Static assets
├── styles/               # Additional styles
├── hooks/                # Custom React hooks
│
├── middleware.ts         # Next.js middleware
├── next.config.mjs       # Next.js configuration
├── tailwind.config.js    # Tailwind CSS config
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies
```

### 4.2 Key Files Explained

| File | Purpose |
|------|---------|
| `middleware.ts` | Route protection, redirects unauthenticated users |
| `lib/db.ts` | MySQL connection pool and query helpers |
| `lib/auth/session.ts` | JWT token creation and verification |
| `lib/actions/*.ts` | Server actions for database operations |
| `lib/actions/offer-batches.ts` | Admin batch offer creation, sending, cancellation |
| `lib/actions/standing-cession.ts` | Standing cession & invoice addendum management |
| `lib/actions/users.ts` | User CRUD operations for admin settings |
| `lib/services/email.ts` | Azure Communication Services integration |

### 4.3 Route Structure

```
Public Routes (No Auth):
├── /                     → Landing page
├── /landing              → Landing page
├── /login/admin          → Admin login
├── /login/ap             → AP login
└── /supplier/access      → Supplier token verification

Protected Routes (Admin):
├── /admin/dashboard      → Admin overview + Quick actions
├── /admin/applications   → Supplier applications
├── /admin/bank-changes   → Bank change request approvals
├── /admin/documents      → Document review
├── /admin/invoices       → Invoice management
├── /admin/offer-batches  → Batch offer creation & management
├── /admin/payments       → Payment processing
├── /admin/reports        → Analytics
├── /admin/settings       → System settings + User management tab
└── /admin/suppliers      → Supplier management

Protected Routes (AP):
├── /ap/dashboard         → AP overview
├── /ap/invoices          → Invoice upload/view
├── /ap/vendors           → Vendor upload
└── /ap/reports           → AP reports

Protected Routes (Supplier):
├── /supplier/dashboard   → Supplier overview
├── /supplier/offers      → View/accept offers (single & multi-select)
├── /supplier/cession-agreement → Sign/upload cession + Standing cession
└── /supplier/profile     → Profile management
```

---

## 5. Development Workflow

### 5.1 Git Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      GIT WORKFLOW                                │
└─────────────────────────────────────────────────────────────────┘

                    ┌───────────┐
                    │  master   │ ← Production branch
                    └─────┬─────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
      ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
      │ feature/  │ │ feature/  │ │   fix/    │
      │ new-api   │ │ dashboard │ │ bug-123   │
      └───────────┘ └───────────┘ └───────────┘
```

#### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/payment-export` |
| Bug Fix | `fix/issue-number` | `fix/123-otp-email` |
| Hotfix | `hotfix/description` | `hotfix/login-redirect` |
| Chore | `chore/description` | `chore/update-deps` |

#### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OTP expiry configuration
fix(invoices): correct discount calculation formula
docs(readme): update installation instructions
refactor(db): extract connection pool configuration
```

### 5.2 Development Commands

```powershell
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type checking (if available)
npx tsc --noEmit
```

### 5.3 Pull Request Process

1. **Create Feature Branch**
   ```powershell
   git checkout -b feature/your-feature
   ```

2. **Make Changes & Commit**
   ```powershell
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push & Create PR**
   ```powershell
   git push origin feature/your-feature
   # Create PR in Azure DevOps
   ```

4. **PR Checklist**
   - [ ] Code compiles without errors
   - [ ] No linting warnings
   - [ ] Tested locally
   - [ ] Documentation updated if needed
   - [ ] PR description explains changes

---

## 6. Coding Standards

### 6.1 TypeScript Guidelines

```typescript
// ✅ DO: Use explicit types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'accounts_payable' | 'supplier';
}

// ❌ DON'T: Use any
const user: any = getUser();

// ✅ DO: Use type inference where obvious
const count = 5; // number is inferred

// ✅ DO: Export types from lib/types/
export interface Supplier {
  supplier_id: number;
  name: string;
  vendor_number: string;
}
```

### 6.2 React Component Guidelines

```tsx
// ✅ Prefer function components with TypeScript
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ✅ Use 'use client' only when needed
'use client';

import { useState } from 'react';

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

### 6.3 Server Actions Guidelines

```typescript
// lib/actions/suppliers.ts
'use server';

import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

// ✅ Always verify session in server actions
export async function getSuppliers() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // ✅ Use parameterized queries
  const suppliers = await query<Supplier[]>(
    'SELECT * FROM suppliers WHERE buyer_id = ?',
    [session.buyerId]
  );

  return suppliers;
}

// ✅ Return typed responses
interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function createSupplier(data: SupplierInput): Promise<ActionResult> {
  try {
    // ... implementation
    return { success: true, message: 'Supplier created' };
  } catch (error) {
    return { success: false, message: 'Failed to create supplier' };
  }
}
```

### 6.4 Tailwind CSS Guidelines

```tsx
// ✅ Use semantic class ordering: layout → spacing → typography → colors → effects
<div className="flex items-center gap-4 p-4 text-sm font-medium text-foreground bg-background rounded-lg shadow-sm">

// ✅ Use theme variables for colors
<div className="bg-background text-foreground border-border">

// ❌ Avoid hardcoded colors (won't work with dark mode)
<div className="bg-white text-black">

// ✅ Use responsive prefixes consistently
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ✅ Extract repeated patterns to components
// components/ui/card.tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      {children}
    </div>
  );
}
```

### 6.5 Database Query Guidelines

```typescript
// ✅ Always use parameterized queries
const result = await query<User[]>(
  'SELECT * FROM users WHERE email = ? AND active = ?',
  [email, true]
);

// ❌ NEVER concatenate SQL strings
const result = await query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ Use transactions for multi-table operations
import { transaction } from '@/lib/db';

await transaction(async (conn) => {
  await conn.execute('INSERT INTO offers VALUES (?)', [offerData]);
  await conn.execute('UPDATE invoices SET status = ? WHERE id = ?', ['offered', invoiceId]);
});
```

---

## 7. Testing Guidelines

### 7.1 Manual Testing Checklist

Before submitting a PR, test these scenarios:

**Authentication:**
- [ ] Admin login with valid credentials
- [ ] AP login with OTP flow
- [ ] Supplier access with token
- [ ] Session expiry and redirect
- [ ] Invalid credentials handling

**Data Operations:**
- [ ] CSV upload (vendors)
- [ ] CSV upload (invoices)
- [ ] Offer generation
- [ ] Offer acceptance/rejection
- [ ] Document upload

**UI/UX:**
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Dark/light mode toggle
- [ ] Form validation errors
- [ ] Loading states
- [ ] Toast notifications

### 7.2 Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (if available)

### 7.3 Test Data

Use the seeded data for testing:

| User | Role | Credentials |
|------|------|-------------|
| admin01 | Admin | Mining@2025 |
| ap01 | AP | APUser@2025 + OTP |
| Supplier | - | Access token from DB |

---

## 8. Database Development

### 8.1 Schema Changes

1. **Create Migration Script**
   ```
   scripts/04-your-change-description.sql
   ```

2. **Script Template**
   ```sql
   -- Migration: 04-your-change-description.sql
   -- Date: 2025-12-03
   -- Author: Your Name
   -- Description: Brief description of changes

   -- Add new column
   ALTER TABLE suppliers ADD COLUMN new_field VARCHAR(100) NULL;

   -- Add index
   CREATE INDEX idx_suppliers_new_field ON suppliers(new_field);

   -- Rollback (keep commented, for reference)
   -- ALTER TABLE suppliers DROP COLUMN new_field;
   ```

3. **Apply to Local DB**
   ```powershell
   mysql -u root -p fmf_scf_platform < scripts/04-your-change.sql
   ```

### 8.2 Database Tables Reference

The system uses 21 tables in the `fmf_scf_platform` database:

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `buyers` | Buyer/Company entities | buyer_id, name, code, trading_name, registration_no, risk_tier, credit_limit |
| `users` | Admin and AP user accounts | user_id, buyer_id, email, role, password_hash, must_change_password |
| `suppliers` | Supplier/Vendor entities | supplier_id, buyer_id, vendor_number, name, bank details |
| `invoices` | Uploaded invoices | invoice_id, buyer_id, supplier_id, document_number, amount |
| `offers` | Early payment offers | offer_id, invoice_id, supplier_id, batch_id, discount_rate, status |
| `offer_batches` | Grouped offers for batch sending | batch_id, buyer_id, name, status, pricing_model |
| `payments` | Payment records | payment_id, offer_id, amount, payment_date, reference |
| `repayments` | Repayment tracking | repayment_id, payment_id, expected_amount |
| `cession_agreements` | Signed cession documents | cession_id, is_standing, parent_cession_id, linked_invoice_ids |
| `bank_change_requests` | Supplier bank detail changes | request_id, supplier_id, status, reviewed_by |
| `supplier_tokens` | Access tokens for supplier portal | token_id, supplier_id, token, short_code, expires_at |
| `notifications` | User notifications | notification_id, user_id, message, is_read |
| `audit_logs` | System audit trail | log_id, user_id, action, entity_type, entity_id |
| `otp_codes` | One-time passwords for AP login | otp_id, user_id, code, expires_at |
| `system_settings` | Global configuration | setting_key, setting_value |
| `trusted_devices` | Remember device feature | device_id, user_id, fingerprint, trusted_until |
| `notification_rules` | Email trigger rules | rule_id, buyer_id, event_type, is_active |
| `email_templates` | Email content templates | template_id, buyer_id, template_type, subject, body |
| `rate_cards` | Buyer pricing rate cards | rate_card_id, name, base_annual_rate, tier_adjustments |
| `buyer_documents` | Buyer onboarding documents | document_id, buyer_id, document_type, verification_status |
| `buyer_change_log` | Buyer profile change history | log_id, buyer_id, field_name, old_value, new_value |

### 8.3 Common Queries

```sql
-- Find supplier by vendor number
SELECT * FROM suppliers WHERE vendor_number = '200008';

-- Get pending offers for a supplier
SELECT o.*, i.document_number, i.amount_doc_curr
FROM offers o
JOIN invoices i ON o.invoice_id = i.invoice_id
WHERE o.supplier_id = 1 AND o.status = 'pending';

-- Get offers by batch
SELECT o.*, i.document_number, s.name as supplier_name
FROM offers o
JOIN invoices i ON o.invoice_id = i.invoice_id
JOIN suppliers s ON o.supplier_id = s.supplier_id
WHERE o.batch_id = 1;

-- Check standing cession for supplier
SELECT * FROM cession_agreements 
WHERE supplier_id = 1 AND is_standing = 1 AND standing_valid_until > NOW();

-- Get cession addendums (linked to parent)
SELECT * FROM cession_agreements 
WHERE parent_cession_id = 1 ORDER BY created_at DESC;

-- Check AP user OTP
SELECT * FROM otp_codes WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1;

-- View recent audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;

-- Get pending bank change requests
SELECT bcr.*, s.name as supplier_name 
FROM bank_change_requests bcr
JOIN suppliers s ON bcr.supplier_id = s.supplier_id
WHERE bcr.status = 'pending';
```

### 8.4 Database Debugging

```typescript
// Enable query logging in development
// In lib/db.ts, add:
if (process.env.NODE_ENV === 'development') {
  console.log('SQL:', sql, params);
}
```

---

## 9. Common Development Tasks

### 9.1 Adding a New Page

1. **Create Page File**
   ```
   app/admin/new-feature/page.tsx
   ```

2. **Basic Page Template**
   ```tsx
   import { getSession } from '@/lib/auth/session';
   import { redirect } from 'next/navigation';

   export default async function NewFeaturePage() {
     const session = await getSession();
     if (!session) redirect('/login/admin');

     return (
       <div className="container mx-auto p-6">
         <h1 className="text-2xl font-bold">New Feature</h1>
         {/* Content */}
       </div>
     );
   }
   ```

### 9.2 Adding a New API Route

1. **Create Route File**
   ```
   app/api/new-endpoint/route.ts
   ```

2. **Basic API Template**
   ```typescript
   import { NextResponse } from 'next/server';
   import { getSession } from '@/lib/auth/session';
   import { query } from '@/lib/db';

   export async function GET(request: Request) {
     try {
       const session = await getSession();
       if (!session) {
         return NextResponse.json(
           { error: 'Unauthorized' },
           { status: 401 }
         );
       }

       const data = await query('SELECT * FROM table');
       return NextResponse.json(data);
     } catch (error) {
       console.error('API Error:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }

   export async function POST(request: Request) {
     try {
       const body = await request.json();
       // Process request...
       return NextResponse.json({ success: true });
     } catch (error) {
       return NextResponse.json(
         { error: 'Bad request' },
         { status: 400 }
       );
     }
   }
   ```

### 9.3 Adding a New Server Action

1. **Create or Edit Action File**
   ```
   lib/actions/new-feature.ts
   ```

2. **Action Template**
   ```typescript
   'use server';

   import { query, transaction } from '@/lib/db';
   import { getSession } from '@/lib/auth/session';
   import { revalidatePath } from 'next/cache';

   export async function createNewThing(data: NewThingInput) {
     const session = await getSession();
     if (!session) {
       return { success: false, message: 'Unauthorized' };
     }

     try {
       await query(
         'INSERT INTO table (col1, col2) VALUES (?, ?)',
         [data.field1, data.field2]
       );

       revalidatePath('/admin/new-feature');
       return { success: true, message: 'Created successfully' };
     } catch (error) {
       console.error('Action error:', error);
       return { success: false, message: 'Failed to create' };
     }
   }
   ```

### 9.4 Adding a UI Component

1. **Using shadcn/ui (Recommended)**
   ```powershell
   npx shadcn@latest add button
   npx shadcn@latest add dialog
   npx shadcn@latest add table
   ```

2. **Custom Component Template**
   ```tsx
   // components/admin/status-badge.tsx
   interface StatusBadgeProps {
     status: 'pending' | 'approved' | 'rejected';
   }

   export function StatusBadge({ status }: StatusBadgeProps) {
     const styles = {
       pending: 'bg-yellow-100 text-yellow-800',
       approved: 'bg-green-100 text-green-800',
       rejected: 'bg-red-100 text-red-800',
     };

     return (
       <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
         {status.charAt(0).toUpperCase() + status.slice(1)}
       </span>
     );
   }
   ```

---

### 9.5 Buyer Onboarding Flow

The buyer onboarding flow is FMF Admin initiated (not self-service):

#### Flow Overview
1. **Create Buyer (Draft)** - Admin creates buyer profile with company details
2. **Upload Documents** - Admin uploads CIPC, tax clearance, financial statements
3. **Verify Documents** - Admin reviews and marks documents as verified/rejected
4. **Assign Rate Card** - Admin assigns pricing rate card and credit limit
5. **Activate Buyer** - Admin activates buyer once all requirements met
6. **Create AP Users** - Admin creates up to 4 AP users per buyer
7. **Send Welcome Email** - System sends email with temp password
8. **First Login** - AP user changes password on first login

#### Key Files

| File | Purpose |
|------|---------|
| `lib/actions/buyers.ts` | Buyer CRUD operations |
| `lib/actions/buyer-users.ts` | Create AP users, send welcome emails |
| `lib/actions/buyer-documents.ts` | Document upload/verify/delete |
| `app/admin/buyers/page.tsx` | Buyer list with filters |
| `app/admin/buyers/[id]/page.tsx` | Buyer details (users, docs, history) |
| `app/login/ap/change-password/page.tsx` | First login password change |
| `app/api/auth/change-password/route.ts` | Password change API |

#### Database Schema (Buyer Onboarding)

```sql
-- Buyer expanded columns (in buyers table)
trading_name, registration_no, tax_id, industry_sector,
risk_tier (A/B/C), address_*, contact_*, 
credit_limit, current_exposure, rate_card_id

-- Users table additions
must_change_password, is_email_verified,
activation_token, activation_expires_at

-- New tables
rate_cards, buyer_documents, buyer_change_log
```

#### Creating an AP User Programmatically

```typescript
import { createUserForBuyer } from '@/lib/actions/buyer-users';

const result = await createUserForBuyer({
  buyer_id: 1,
  username: 'aap_user1',
  email: 'user@mine.com',
  full_name: 'John Doe',
  phone: '+27 82 123 4567',
  send_welcome_email: true // Sends email with temp password
});

// result.tempPassword contains the generated password
```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### "Module not found" Error

```powershell
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf .next
npm install --legacy-peer-deps
```

#### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Ensure MySQL is running
2. Check credentials in `.env.local`
3. Verify database exists

#### Build Errors

```powershell
# Check for TypeScript errors
npx tsc --noEmit

# If persistent, check next.config.mjs:
# typescript: { ignoreBuildErrors: true }
```

#### Session/Auth Issues

```
# Clear cookies in browser
# Check JWT_SECRET matches in .env.local
# Verify session expiry times in lib/auth/session.ts
```

### 10.2 Debug Mode

```typescript
// Add to any server component or action
console.log('[DEBUG]', variableName);

// Check terminal output for server-side logs
// Check browser console for client-side logs
```

### 10.3 Database Debugging

```sql
-- Check table structure
DESCRIBE suppliers;

-- Check recent records
SELECT * FROM suppliers ORDER BY created_at DESC LIMIT 5;

-- Check foreign key constraints
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'fmf_scf_platform';
```

---

## 11. Resources & Documentation

### 11.1 Internal Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Technical Docs | `TECHNICAL_DOCUMENTATION.md` | Full system documentation |
| System Architecture | `SYSTEM_ARCHITECTURE.md` | Architecture diagrams |
| API Reference | `API_DOCUMENTATION.md` | API endpoints |
| User Guide | `USER_GUIDE.md` | End-user documentation |
| Operations | `OPERATIONS_RUNBOOK.md` | Operational procedures |
| Security | `SECURITY_DOCUMENTATION.md` | Security guidelines |
| Database Setup | `DATABASE_SETUP.md` | Database installation |
| Deployment | `DEPLOYMENT.md` | Deployment guide |

### 11.2 External Resources

| Resource | Link |
|----------|------|
| Next.js Docs | https://nextjs.org/docs |
| React Docs | https://react.dev |
| Tailwind CSS | https://tailwindcss.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| MySQL Docs | https://dev.mysql.com/doc |
| Azure Docs | https://docs.microsoft.com/azure |
| TypeScript | https://www.typescriptlang.org/docs |

### 11.3 Getting Help

1. **Check existing documentation** (this guide, technical docs)
2. **Search codebase** for similar implementations
3. **Ask team members** via Teams/Slack
4. **Azure DevOps Discussions** for architectural questions

### 11.4 Team Contacts

| Role | Contact | Topics |
|------|---------|--------|
| Tech Lead | team-lead@company.com | Architecture, major decisions |
| DevOps | devops@company.com | Deployments, infrastructure |
| DBA | dba@company.com | Database issues |
| Support | support@company.com | Production issues |

---

## Appendix A: Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | localhost | MySQL host |
| `DB_PORT` | No | 3306 | MySQL port |
| `DB_USER` | Yes | - | Database user |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | Yes | fmf_scf_platform | Database name |
| `JWT_SECRET` | Yes | - | Secret for JWT (min 32 chars) |
| `BASE_URL` | Yes | - | Application URL |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | No* | - | Email service |
| `AZURE_STORAGE_CONNECTION_STRING` | No* | - | Blob storage |

*Required for full functionality

---

## Appendix B: Useful Scripts

```powershell
# Quick database reset (CAREFUL!)
mysql -u root -p -e "DROP DATABASE fmf_scf_platform; CREATE DATABASE fmf_scf_platform;"
mysql -u root -p fmf_scf_platform < scripts/01-create-database-schema.sql
mysql -u root -p fmf_scf_platform < scripts/02-seed-initial-data.sql

# Generate types from database (future)
# npx prisma generate

# Check for security vulnerabilities
npm audit

# Update dependencies (careful with major versions)
npm update

# Clear all caches
rm -rf .next node_modules/.cache
```

---

## Appendix C: Keyboard Shortcuts (VS Code)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick file open |
| `Ctrl+Shift+F` | Search in files |
| `F12` | Go to definition |
| `Alt+F12` | Peek definition |
| `Shift+F12` | Find all references |
| `Ctrl+`` | Toggle terminal |
| `Ctrl+B` | Toggle sidebar |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | December 3, 2025 | Development Team | Initial release |
| 1.1.0 | June 14, 2025 | Development Team | Added Phase 1 features: offer batches, standing cession, user management, bank change requests. Updated database tables section with new tables (offer_batches, trusted_devices, notification_rules, email_templates). |
| 1.2.0 | June 15, 2025 | Development Team | Added buyer onboarding (Module 0.4): rate_cards, buyer_documents, buyer_change_log tables. Added lib/actions/buyer-users.ts, buyer-documents.ts. Added first login password change flow. Updated database schema with 22 new columns in buyers, 4 in users. |

---

**Happy Coding! 🚀**

If you have suggestions for improving this guide, please submit a PR!

---

© 2025 Future Cashflow (Pty) Ltd · NCRCP18174
