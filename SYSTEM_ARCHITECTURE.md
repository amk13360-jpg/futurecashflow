# Future Cashflow - System Architecture Document
## Supply Chain Finance Platform

**Version:** 1.0.0  
**Last Updated:** December 3, 2025  
**Classification:** Internal Technical Document  
**Author:** Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [System Components](#3-system-components)
4. [Data Architecture](#4-data-architecture)
5. [Integration Architecture](#5-integration-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Scalability & Performance](#8-scalability--performance)
9. [Disaster Recovery](#9-disaster-recovery)
10. [Architecture Decision Records](#10-architecture-decision-records)

---

## 1. Executive Summary

### 1.1 Document Purpose

This document provides a comprehensive view of the Future Cashflow SCF Platform architecture, serving as the primary reference for understanding system design, component interactions, and technical decisions.

### 1.2 System Overview

Future Cashflow is an enterprise Supply Chain Finance (SCF) platform designed specifically for the South African mining industry. The platform enables:

- **Early Payment Programs** - Suppliers receive payment before invoice due dates
- **Discount Management** - Automated calculation of early payment discounts
- **Multi-tenant Operations** - Supporting multiple mining companies (buyers)
- **Regulatory Compliance** - POPIA-compliant data handling

### 1.3 Key Architectural Characteristics

| Characteristic | Implementation |
|----------------|----------------|
| **Architecture Style** | Monolithic with Modular Design |
| **Deployment Model** | Platform as a Service (PaaS) |
| **Cloud Provider** | Microsoft Azure |
| **Region** | South Africa North (Johannesburg) |
| **Availability Target** | 99.5% uptime |
| **Data Residency** | South Africa (POPIA compliance) |

---

## 2. Architecture Overview

### 2.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   INTERNET                                       │
│                              (HTTPS/TLS 1.2+)                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AZURE FRONT DOOR (Optional)                              │
│                      CDN / WAF / Load Balancing / SSL                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                        AZURE APP SERVICE (Linux)                                 │
│                         fm-asp-dev-san-*.azurewebsites.net                       │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐     │
│  │                                                                         │     │
│  │                      NEXT.JS 16 APPLICATION                            │     │
│  │                         (Node.js 20 LTS)                               │     │
│  │                                                                         │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │     │
│  │  │  FRONTEND   │  │  BACKEND    │  │  SERVICES   │  │ MIDDLEWARE  │   │     │
│  │  │             │  │             │  │             │  │             │   │     │
│  │  │ • React 19  │  │ • API Routes│  │ • Email     │  │ • Auth      │   │     │
│  │  │ • RSC       │  │ • Server    │  │ • Blob      │  │ • Session   │   │     │
│  │  │ • shadcn/ui │  │   Actions   │  │   Storage   │  │ • RBAC      │   │     │
│  │  │ • Tailwind  │  │ • Database  │  │ • PDF Gen   │  │             │   │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │     │
│  │                                                                         │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
          │                         │                              │
          │                         │                              │
          ▼                         ▼                              ▼
┌──────────────────┐    ┌──────────────────┐         ┌──────────────────┐
│                  │    │                  │         │                  │
│   AZURE MYSQL    │    │   AZURE BLOB     │         │   AZURE COMM.    │
│ FLEXIBLE SERVER  │    │    STORAGE       │         │    SERVICES      │
│                  │    │                  │         │                  │
│ ┌──────────────┐ │    │ ┌──────────────┐ │         │ ┌──────────────┐ │
│ │fmf_scf_      │ │    │ │cession-      │ │         │ │ Email        │ │
│ │platform      │ │    │ │agreements    │ │         │ │ Delivery     │ │
│ │              │ │    │ │              │ │         │ │              │ │
│ │ • buyers     │ │    │ │ • PDF Files  │ │         │ │ • OTP        │ │
│ │ • suppliers  │ │    │ │ • Documents  │ │         │ │ • Welcome    │ │
│ │ • invoices   │ │    │ │              │ │         │ │ • Approval   │ │
│ │ • offers     │ │    │ │              │ │         │ │              │ │
│ │ • payments   │ │    │ │              │ │         │ │              │ │
│ └──────────────┘ │    │ └──────────────┘ │         │ └──────────────┘ │
│                  │    │                  │         │                  │
│  SSL/TLS 1.2     │    │  Public Blobs    │         │  SMTP Relay      │
│  3306            │    │  Hot Tier        │         │                  │
│                  │    │                  │         │                  │
└──────────────────┘    └──────────────────┘         └──────────────────┘
```

### 2.2 Architectural Patterns

| Pattern | Usage |
|---------|-------|
| **Server-Side Rendering (SSR)** | Initial page loads for SEO and performance |
| **React Server Components (RSC)** | Data fetching at component level |
| **Server Actions** | Form submissions and mutations |
| **API Routes** | Client-side data fetching and external integrations |
| **Connection Pooling** | Database connection management |
| **Token-Based Auth** | JWT for session management |

### 2.3 Technology Stack Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                         │
├────────────────────────────────────────────────────────────────────┤
│  React 19 │ Next.js 16 │ TypeScript │ Tailwind CSS │ shadcn/ui    │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                          │
├────────────────────────────────────────────────────────────────────┤
│  Server Actions │ API Routes │ Middleware │ Authentication         │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                             │
├────────────────────────────────────────────────────────────────────┤
│  Email Service │ Blob Storage │ PDF Generation │ Audit Logging     │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                               │
├────────────────────────────────────────────────────────────────────┤
│  MySQL 8.0 │ Connection Pool │ SSL/TLS Encryption                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. System Components

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APPLICATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                            APP DIRECTORY                                │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  (public)   │  │   admin     │  │     ap      │  │  supplier   │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ • landing   │  │ • dashboard │  │ • dashboard │  │ • dashboard │   │ │
│  │  │ • login     │  │ • suppliers │  │ • invoices  │  │ • offers    │   │ │
│  │  │             │  │ • documents │  │ • vendors   │  │ • cession   │   │ │
│  │  │             │  │ • payments  │  │ • reports   │  │ • profile   │   │ │
│  │  │             │  │ • settings  │  │             │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                         API ROUTES                               │   │ │
│  │  │                                                                  │   │ │
│  │  │  /api/auth       - Authentication endpoints                      │   │ │
│  │  │  /api/invoices   - Invoice management                            │   │ │
│  │  │  /api/payments   - Payment processing                            │   │ │
│  │  │  /api/suppliers  - Supplier management                           │   │ │
│  │  │  /api/cession-agreement - Document handling                      │   │ │
│  │  │                                                                  │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                            LIB DIRECTORY                                │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  actions/   │  │    auth/    │  │  services/  │  │   types/    │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ • admin     │  │ • session   │  │ • email     │  │ • admin     │   │ │
│  │  │ • invoices  │  │ • password  │  │ • blob-     │  │ • ap        │   │ │
│  │  │ • payments  │  │ • audit     │  │   storage   │  │ • supplier  │   │ │
│  │  │ • suppliers │  │             │  │             │  │             │   │ │
│  │  │ • settings  │  │             │  │             │  │             │   │ │
│  │  │ • reports   │  │             │  │             │  │             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────────┐    │ │
│  │  │                          db.ts                                  │    │ │
│  │  │  MySQL Connection Pool • Query Helper • Transaction Support     │    │ │
│  │  └────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         COMPONENTS DIRECTORY                            │ │
│  │                                                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │ │
│  │  │   ui/    │  │  admin/  │  │ supplier/│  │  Theme Components    │   │ │
│  │  │          │  │          │  │          │  │                      │   │ │
│  │  │ 45+ UI   │  │ Dashboard│  │ Header   │  │ • ThemeProvider      │   │ │
│  │  │ Comps    │  │ Header   │  │ Cards    │  │ • ThemeToggle        │   │ │
│  │  │ shadcn   │  │ MetricCd │  │          │  │ • ClientToaster      │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘   │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Descriptions

#### 3.2.1 Presentation Components

| Component | Purpose | Technologies |
|-----------|---------|--------------|
| **Landing Page** | Public marketing page | React, Tailwind |
| **Admin Dashboard** | Platform administration | RSC, shadcn/ui |
| **AP Dashboard** | Invoice/Vendor management | RSC, Client Components |
| **Supplier Portal** | Offer management, profile | RSC, Forms |
| **UI Components** | Reusable UI elements | shadcn/ui, Radix |

#### 3.2.2 Application Components

| Component | File Location | Responsibility |
|-----------|---------------|----------------|
| **Middleware** | `middleware.ts` | Route protection, session validation |
| **Session Manager** | `lib/auth/session.ts` | JWT creation, verification |
| **Password Manager** | `lib/auth/password.ts` | bcrypt hashing, verification |
| **Audit Logger** | `lib/auth/audit.ts` | Activity tracking |

#### 3.2.3 Service Components

| Service | File Location | External Dependency |
|---------|---------------|---------------------|
| **Email Service** | `lib/services/email.ts` | Azure Communication Services |
| **Blob Storage** | `lib/services/blob-storage.ts` | Azure Blob Storage |
| **PDF Generator** | `lib/actions/*.ts` | pdf-lib |

#### 3.2.4 Data Components

| Component | File Location | Purpose |
|-----------|---------------|---------|
| **Connection Pool** | `lib/db.ts` | MySQL connection management |
| **Query Helper** | `lib/db.ts` | Parameterized query execution |
| **Transaction Manager** | `lib/db.ts` | ACID transaction support |

### 3.3 Module Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEPENDENCY GRAPH                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   app/pages  │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │  components/ │  │  lib/actions │  │  app/api/    │
          └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                 │                 │                 │
                 │                 ├─────────────────┤
                 │                 │                 │
                 ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ components/ui│  │  lib/auth/   │  │ lib/services │
          └──────────────┘  └──────┬───────┘  └──────┬───────┘
                                   │                 │
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌──────────────┐
                                   │   lib/db.ts  │
                                   └──────────────┘
                                            │
                                            ▼
                                   ┌──────────────┐
                                   │ Azure MySQL  │
                                   └──────────────┘
```

---

## 4. Data Architecture

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP DIAGRAM                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐                           ┌─────────────────┐
    │     BUYERS      │                           │      USERS      │
    ├─────────────────┤                           ├─────────────────┤
    │ PK  buyer_id    │◄──────────────────────────│ FK  buyer_id    │
    │     name        │                           │ PK  user_id     │
    │ UK  code        │                           │ UK  username    │
    │     contact_*   │                           │ UK  email       │
    │     active_*    │                           │     password_   │
    │                 │                           │       hash      │
    │                 │                           │     role        │
    └────────┬────────┘                           └─────────────────┘
             │
             │ 1:N
             │
             ▼
    ┌─────────────────┐         1:N          ┌─────────────────┐
    │   SUPPLIERS     │◄─────────────────────│    INVOICES     │
    ├─────────────────┤                      ├─────────────────┤
    │ PK  supplier_id │                      │ PK  invoice_id  │
    │ UK  vendor_no   │                      │ FK  buyer_id    │
    │     company_code│                      │ FK  supplier_id │
    │     name        │                      │ UK  document_no │
    │     contact_*   │                      │     amount_*    │
    │     bank_*      │                      │     due_date    │
    │     onboarding_ │                      │     status      │
    │       status    │                      │                 │
    │     access_     │                      │                 │
    │       token     │                      │                 │
    │     cession_*   │                      │                 │
    └────────┬────────┘                      └────────┬────────┘
             │                                        │
             │ 1:N                                    │ 1:N
             │                                        │
             ▼                                        ▼
    ┌─────────────────┐                      ┌─────────────────┐
    │ CESSION_DOCS    │                      │     OFFERS      │
    ├─────────────────┤                      ├─────────────────┤
    │ PK  id          │                      │ PK  offer_id    │
    │ FK  supplier_id │                      │ FK  invoice_id  │
    │     document_url│                      │ FK  supplier_id │
    │     status      │                      │ FK  buyer_id    │
    │     uploaded_at │                      │     amount_*    │
    │     reviewed_by │                      │     discount_*  │
    │                 │                      │     status      │
    └─────────────────┘                      │     expiry_date │
                                             └────────┬────────┘
                                                      │
                                                      │ 1:N
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │    PAYMENTS     │
                                             ├─────────────────┤
                                             │ PK  payment_id  │
                                             │ FK  offer_id    │
                                             │ FK  supplier_id │
                                             │ FK  buyer_id    │
                                             │     amount      │
                                             │     status      │
                                             │     payment_ref │
                                             │     disbursed_at│
                                             └─────────────────┘

    ┌─────────────────┐                      ┌─────────────────┐
    │  AUDIT_LOGS     │                      │ SYSTEM_SETTINGS │
    ├─────────────────┤                      ├─────────────────┤
    │ PK  log_id      │                      │ PK  setting_id  │
    │ FK  user_id     │                      │ UK  setting_key │
    │     action      │                      │     setting_val │
    │     entity_*    │                      │     description │
    │     ip_address  │                      │     updated_at  │
    │     user_agent  │                      │     updated_by  │
    │     timestamp   │                      │                 │
    └─────────────────┘                      └─────────────────┘
```

### 4.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRIMARY DATA FLOWS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

FLOW 1: VENDOR ONBOARDING
┌──────────┐    CSV     ┌──────────┐   Create   ┌──────────┐   Email   ┌──────────┐
│  AP User │───────────►│  System  │───────────►│ Suppliers│──────────►│ Supplier │
│          │            │          │            │  Table   │           │  Inbox   │
└──────────┘            └──────────┘            └──────────┘           └──────────┘

FLOW 2: INVOICE PROCESSING
┌──────────┐    CSV     ┌──────────┐   Match    ┌──────────┐  Generate  ┌──────────┐
│  AP User │───────────►│  System  │───────────►│ Invoices │───────────►│  Offers  │
│          │            │          │            │  Table   │            │  Table   │
└──────────┘            └──────────┘            └──────────┘            └──────────┘

FLOW 3: OFFER ACCEPTANCE
┌──────────┐   Accept   ┌──────────┐   Update   ┌──────────┐   Create   ┌──────────┐
│ Supplier │───────────►│  System  │───────────►│  Offers  │───────────►│ Payments │
│          │            │          │            │  Table   │            │  Table   │
└──────────┘            └──────────┘            └──────────┘            └──────────┘

FLOW 4: DOCUMENT UPLOAD
┌──────────┐   Upload   ┌──────────┐   Store    ┌──────────┐   Update   ┌──────────┐
│ Supplier │───────────►│   API    │───────────►│   Blob   │───────────►│ Suppliers│
│          │            │          │            │ Storage  │            │  Table   │
└──────────┘            └──────────┘            └──────────┘            └──────────┘
```

### 4.3 Database Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Normalization** | 3NF for transactional tables |
| **Indexing** | B-tree indexes on FK columns and search fields |
| **Constraints** | Foreign keys, unique constraints, NOT NULL |
| **Audit Trail** | Created/updated timestamps on all tables |
| **Soft Deletes** | Status fields rather than physical deletion |
| **Connection Security** | SSL/TLS 1.2 mandatory |

---

## 5. Integration Architecture

### 5.1 External System Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           SCF PLATFORM                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        INTEGRATION LAYER                              │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Email     │  │    Blob     │  │   Database  │  │   Future    │  │  │
│  │  │  Service    │  │   Storage   │  │  Connection │  │   (ERP)     │  │  │
│  │  │ Interface   │  │  Interface  │  │  Interface  │  │  Interface  │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  │         │                │                │                │         │  │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────┘  │
│            │                │                │                │            │
└────────────┼────────────────┼────────────────┼────────────────┼────────────┘
             │                │                │                │
             ▼                ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Azure     │  │   Azure     │  │   Azure     │  │    SAP      │
    │   Comm.     │  │   Blob      │  │   MySQL     │  │  (Future)   │
    │  Services   │  │  Storage    │  │  Flexible   │  │             │
    │             │  │             │  │   Server    │  │  CSV Import │
    │  SMTP API   │  │  REST API   │  │   TCP 3306  │  │             │
    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### 5.2 Integration Details

#### 5.2.1 Azure Communication Services (Email)

```typescript
// Integration Pattern: SDK-based
// Connection: HTTPS with connection string authentication

Interface: EmailClient from @azure/communication-email
Protocol: HTTPS REST API
Authentication: Connection String (stored in env vars)
Rate Limits: 100 emails/minute (Azure default)
Retry Policy: Built-in with exponential backoff

Email Types:
├── OTP Email (login authentication)
├── Welcome Email (new supplier invitation)
├── Approval Email (supplier approved)
└── Notification Emails (future)
```

#### 5.2.2 Azure Blob Storage

```typescript
// Integration Pattern: SDK-based
// Connection: HTTPS with connection string authentication

Interface: BlobServiceClient from @azure/storage-blob
Container: cession-agreements
Access Level: Public read (blob level)
Naming Convention: {supplier_id}-{timestamp}-{uuid}-{filename}

Operations:
├── uploadToBlobStorage() - Upload PDF documents
├── deleteFromBlobStorage() - Remove documents (admin)
└── getBlobUrl() - Retrieve public URL
```

#### 5.2.3 MySQL Database

```typescript
// Integration Pattern: Connection Pool
// Connection: TCP with SSL/TLS encryption

Library: mysql2/promise
Pool Size: 10 connections
SSL: TLSv1.2 minimum
Timeout: Default MySQL timeouts

Connection Config:
├── host: futurefinancecashflow.mysql.database.azure.com
├── port: 3306
├── database: fmf_scf_platform
├── ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' }
└── waitForConnections: true
```

### 5.3 CSV Import Integration

The platform receives data from buyer ERP systems via CSV files:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CSV IMPORT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐
│ SAP/ERP  │ Export  │  AP User │ Upload  │ Platform │
│  System  │────────►│ Desktop  │────────►│ CSV API  │
└──────────┘         └──────────┘         └──────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │                                                      │
                     ▼                                                      ▼
              ┌──────────────┐                                      ┌──────────────┐
              │    VENDOR    │                                      │   INVOICE    │
              │   UPLOAD     │                                      │   UPLOAD     │
              │              │                                      │              │
              │ 17 columns   │                                      │ 19 columns   │
              │ Create/Update│                                      │ Match/Create │
              │ Send Emails  │                                      │ Gen. Offers  │
              └──────────────┘                                      └──────────────┘
```

---

## 6. Security Architecture

### 6.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: TRANSPORT SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  • HTTPS/TLS 1.2+ for all traffic                                           │
│  • Azure-managed SSL certificates                                           │
│  • HSTS headers enabled                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Layer 2: AUTHENTICATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  • JWT tokens (HS256) for session management                                │
│  • bcrypt (cost=10) for password hashing                                    │
│  • OTP via email for AP users (2FA)                                         │
│  • Access tokens for suppliers (magic links)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Layer 3: AUTHORIZATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Role-Based Access Control (RBAC)                                         │
│  • Middleware route protection                                              │
│  • Server-side permission checks                                            │
│  • Separate session cookies by user type                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Layer 4: DATA PROTECTION
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Parameterized SQL queries (SQL injection prevention)                     │
│  • Input validation and sanitization                                        │
│  • Sensitive data encryption at rest (Azure)                                │
│  • POPIA-compliant data handling                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Layer 5: AUDIT & MONITORING
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Comprehensive audit logging                                               │
│  • IP address and user agent tracking                                       │
│  • Azure Application Insights (future)                                      │
│  • Failed login attempt monitoring                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Authentication Flows

```
ADMIN/AP USER AUTHENTICATION:
┌────────────┐    Credentials    ┌────────────┐    Generate    ┌────────────┐
│   User     │──────────────────►│   Server   │───────────────►│    OTP     │
│            │                   │            │                │            │
└────────────┘                   └────────────┘                └────────────┘
      ▲                                                              │
      │                                                              │ Email
      │                                                              ▼
┌────────────┐    JWT Cookie     ┌────────────┐     Submit     ┌────────────┐
│  Dashboard │◄──────────────────│   Server   │◄───────────────│   User     │
│            │                   │            │                │            │
└────────────┘                   └────────────┘                └────────────┘


SUPPLIER AUTHENTICATION:
┌────────────┐    Access Token   ┌────────────┐    Verify      ┌────────────┐
│  Email     │──────────────────►│   Server   │───────────────►│  Database  │
│  Link      │                   │            │                │            │
└────────────┘                   └────────────┘                └────────────┘
                                       │
                                       │ Supplier JWT
                                       ▼
                               ┌────────────┐
                               │  Dashboard │
                               │            │
                               └────────────┘
```

### 6.3 Role-Based Access Control Matrix

| Resource | Admin | AP | Supplier |
|----------|-------|-----|----------|
| View Dashboard | ✅ | ✅ | ✅ (own) |
| Upload Vendors | ❌ | ✅ | ❌ |
| Upload Invoices | ❌ | ✅ | ❌ |
| Approve Suppliers | ✅ | ❌ | ❌ |
| Review Documents | ✅ | ❌ | ❌ |
| Accept/Reject Offers | ❌ | ❌ | ✅ |
| Process Payments | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ (own) |
| Manage Settings | ✅ | ❌ | ❌ |

---

## 7. Deployment Architecture

### 7.1 Azure Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AZURE DEPLOYMENT ARCHITECTURE                             │
│                        South Africa North Region                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESOURCE GROUP: fm-rg-dev-san                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    APP SERVICE PLAN (Linux B1)                       │    │
│  │                                                                      │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    WEB APP: fm-asp-dev-san                    │   │    │
│  │  │                                                               │   │    │
│  │  │  Runtime: Node.js 20 LTS                                      │   │    │
│  │  │  Startup: node server.js                                      │   │    │
│  │  │  Always On: Enabled                                           │   │    │
│  │  │  HTTPS Only: Enabled                                          │   │    │
│  │  │                                                               │   │    │
│  │  │  Environment Variables:                                       │   │    │
│  │  │  ├── DB_HOST, DB_USER, DB_PASSWORD, DB_NAME                  │   │    │
│  │  │  ├── JWT_SECRET                                               │   │    │
│  │  │  ├── AZURE_COMMUNICATION_CONNECTION_STRING                    │   │    │
│  │  │  ├── AZURE_STORAGE_CONNECTION_STRING                          │   │    │
│  │  │  └── BASE_URL                                                 │   │    │
│  │  │                                                               │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              MYSQL FLEXIBLE SERVER: futurefinancecashflow           │    │
│  │                                                                      │    │
│  │  SKU: Standard_B1s (1 vCore, 1GB RAM)                               │    │
│  │  Storage: 32 GB                                                      │    │
│  │  SSL: Enforced                                                       │    │
│  │  Backup: 7 days retention                                            │    │
│  │  Database: fmf_scf_platform                                          │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │            STORAGE ACCOUNT: fmscfplatformstorage                     │    │
│  │                                                                      │    │
│  │  Type: StorageV2 (General Purpose v2)                               │    │
│  │  Tier: Hot                                                           │    │
│  │  Container: cession-agreements                                       │    │
│  │  Access: Public (blob level)                                         │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │          COMMUNICATION SERVICES: fm-acs-dev-san                      │    │
│  │                                                                      │    │
│  │  Email Domain: Azure-managed                                         │    │
│  │  Sender: DoNotReply@*.azurecomm.net                                 │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE                                     │
│                        Azure DevOps Pipelines                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Developer  │     │  Azure       │     │    Build     │     │   Deploy     │
│   Commits    │────►│  DevOps      │────►│    Stage     │────►│   Stage      │
│   to master  │     │  Trigger     │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │                     │
                                                ▼                     ▼
                                    ┌──────────────────┐   ┌──────────────────┐
                                    │  • Install deps  │   │  • Zip Deploy    │
                                    │  • npm run build │   │  • App Service   │
                                    │  • Archive files │   │  • node server.js│
                                    │  • Publish drop  │   │                  │
                                    └──────────────────┘   └──────────────────┘

Pipeline Configuration:
├── Trigger: master branch
├── Pool: ubuntu-latest
├── Node Version: 20.x
├── Build: npm install && npm run build
├── Deploy: AzureWebApp@1 task
└── Startup: node server.js
```

### 7.3 Environment Configuration

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Development** | Local development | http://localhost:3000 |
| **Production** | Live system | https://fm-asp-dev-san-*.azurewebsites.net |

---

## 8. Scalability & Performance

### 8.1 Current Capacity

| Metric | Current Configuration | Capacity |
|--------|----------------------|----------|
| **App Service** | B1 (1 core, 1.75 GB) | ~100 concurrent users |
| **Database** | Standard_B1s (1 vCore) | ~50 connections |
| **Connection Pool** | 10 connections | Adequate for current load |
| **Blob Storage** | Standard LRS | Practically unlimited |

### 8.2 Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCALING ROADMAP                                      │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: VERTICAL SCALING (Current → 500 users)
┌─────────────────────────────────────────────────────────────────────────────┐
│  • App Service: B1 → S1/P1v2                                                │
│  • MySQL: B1s → D2s (2 vCores)                                              │
│  • Connection Pool: 10 → 25                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 2: HORIZONTAL SCALING (500 → 2000 users)
┌─────────────────────────────────────────────────────────────────────────────┐
│  • App Service: Enable auto-scaling (2-5 instances)                         │
│  • MySQL: D4s (4 vCores) with read replicas                                 │
│  • Add Azure Front Door for load balancing                                  │
│  • Add Redis for session management                                         │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 3: ENTERPRISE SCALING (2000+ users)
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Consider microservices decomposition                                      │
│  • Database sharding by buyer_id                                            │
│  • Event-driven architecture for async processing                           │
│  • Azure Kubernetes Service (AKS) deployment                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Performance Optimization

| Area | Current Implementation | Future Optimization |
|------|----------------------|---------------------|
| **Database** | Connection pooling | Query optimization, indexes |
| **Frontend** | Next.js SSR | Edge caching, CDN |
| **API** | Server actions | Response caching |
| **Files** | Blob Storage | CDN for documents |

---

## 9. Disaster Recovery

### 9.1 Backup Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKUP STRATEGY                                    │
└─────────────────────────────────────────────────────────────────────────────┘

COMPONENT                    BACKUP METHOD               RETENTION
─────────────────────────────────────────────────────────────────────
MySQL Database              Azure Auto-backup            7 days
Blob Storage                LRS (3 copies in region)    Indefinite
Application Code            Azure DevOps Git             Indefinite
Configuration               Environment Variables        Manual

RECOVERY POINT OBJECTIVES (RPO):
├── Database: 1 hour (point-in-time recovery)
├── Files: Real-time (LRS replication)
└── Code: Git history (unlimited)

RECOVERY TIME OBJECTIVES (RTO):
├── Database: 1-2 hours
├── Application: 15-30 minutes (redeploy)
└── Full System: 2-4 hours
```

### 9.2 Disaster Recovery Procedures

| Scenario | Recovery Procedure | RTO |
|----------|-------------------|-----|
| **Database Corruption** | Point-in-time restore from Azure | 1-2 hours |
| **Region Outage** | Deploy to secondary region (future) | 4-8 hours |
| **Code Issues** | Rollback via Azure DevOps | 15 minutes |
| **Data Deletion** | Restore from backup | 1-2 hours |

---

## 10. Architecture Decision Records

### ADR-001: Monolithic Architecture

**Status:** Accepted  
**Context:** Initial platform development with small team  
**Decision:** Build as monolithic Next.js application  
**Consequences:**  
- ✅ Faster development velocity
- ✅ Simpler deployment and operations
- ✅ Lower infrastructure costs
- ⚠️ Scaling requires vertical before horizontal
- ⚠️ May need decomposition at scale

### ADR-002: Next.js with App Router

**Status:** Accepted  
**Context:** Need modern React framework with SSR  
**Decision:** Use Next.js 16 with App Router  
**Consequences:**  
- ✅ Server Components reduce client bundle
- ✅ Built-in API routes and Server Actions
- ✅ Excellent TypeScript support
- ⚠️ Learning curve for React Server Components

### ADR-003: MySQL Database

**Status:** Accepted  
**Context:** Need relational database for financial data  
**Decision:** Use Azure MySQL Flexible Server  
**Consequences:**  
- ✅ ACID compliance for financial transactions
- ✅ Azure-managed infrastructure
- ✅ Built-in backups and HA options
- ⚠️ Connection pooling required for serverless

### ADR-004: JWT for Sessions

**Status:** Accepted  
**Context:** Need stateless session management  
**Decision:** Use JWT tokens with jose library  
**Consequences:**  
- ✅ Stateless, scalable authentication
- ✅ Works with Next.js middleware
- ⚠️ Token revocation requires additional logic
- ⚠️ Token size in cookies

### ADR-005: Azure Communication Services for Email

**Status:** Accepted  
**Context:** Need reliable transactional email  
**Decision:** Use Azure Communication Services  
**Consequences:**  
- ✅ Integrated Azure billing
- ✅ Reliable delivery with tracking
- ⚠️ Limited email templates
- ⚠️ Requires Azure subscription

### ADR-006: Blob Storage for Documents

**Status:** Accepted  
**Context:** Need persistent file storage for cession agreements  
**Decision:** Use Azure Blob Storage  
**Consequences:**  
- ✅ Scalable, durable storage
- ✅ Public URLs for document access
- ✅ Integrated with Azure ecosystem
- ⚠️ Requires proper access control

---

## Appendix A: Resource Naming Conventions

| Resource Type | Naming Pattern | Example |
|--------------|----------------|---------|
| Resource Group | `fm-rg-{env}-{region}` | fm-rg-dev-san |
| App Service | `fm-asp-{env}-{region}` | fm-asp-dev-san |
| MySQL Server | `{company}cashflow` | futurefinancecashflow |
| Storage Account | `fmscfplatform{purpose}` | fmscfplatformstorage |
| Communication Service | `fm-acs-{env}-{region}` | fm-acs-dev-san |

---

## Appendix B: Port and Protocol Reference

| Service | Protocol | Port | Direction |
|---------|----------|------|-----------|
| Web Application | HTTPS | 443 | Inbound |
| MySQL Database | TCP (SSL) | 3306 | Outbound |
| Blob Storage | HTTPS | 443 | Outbound |
| Email Service | HTTPS | 443 | Outbound |

---

## Appendix C: Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | MySQL server hostname | Yes |
| `DB_PORT` | MySQL port (default 3306) | No |
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_NAME` | Database name | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | Email service connection | Yes |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob storage connection | Yes |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name | No |
| `BASE_URL` | Application base URL | Yes |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | December 3, 2025 | Development Team | Initial release |

---

© 2025 Future Cashflow (Pty) Ltd · NCRCP18174 · All rights reserved
