# SCF Platform API Documentation

## Supply Chain Finance Platform - REST API Reference

**Version:** 1.0  
**Base URL:** `https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net`  
**Last Updated:** December 2025

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Request & Response Format](#3-request--response-format)
4. [Error Handling](#4-error-handling)
5. [API Endpoints](#5-api-endpoints)
   - [Authentication APIs](#51-authentication-apis)
   - [Supplier APIs](#52-supplier-apis)
   - [Invoice APIs](#53-invoice-apis)
   - [Payment APIs](#54-payment-apis)
   - [Cession Agreement APIs](#55-cession-agreement-apis)
6. [Server Actions](#6-server-actions)
7. [Data Models](#7-data-models)
8. [Rate Limiting](#8-rate-limiting)
9. [Changelog](#9-changelog)

---

## 1. Overview

### 1.1 About This API

The SCF Platform API provides programmatic access to the Supply Chain Finance Platform functionality. It enables:

- User authentication (Admin, AP, Supplier)
- Supplier management and onboarding
- Invoice and vendor data upload
- Offer management
- Payment processing
- Document management

### 1.2 API Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SCF PLATFORM API                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   REST API   │  │Server Actions│  │  Middleware  │           │
│  │  /api/*      │  │  lib/actions │  │  Auth Guard  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
│                    ┌──────▼───────┐                              │
│                    │   MySQL DB   │                              │
│                    │  Azure Flex  │                              │
│                    └──────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Runtime | Node.js 20 |
| Database | MySQL 8.0 (Azure Flexible Server) |
| Authentication | JWT (jose library) |
| Email | Azure Communication Services |
| File Storage | Azure Blob Storage |

---

## 2. Authentication

### 2.1 Authentication Methods

The API supports three authentication methods based on user type:

| User Type | Method | Token Duration |
|-----------|--------|----------------|
| Admin | Username/Password → JWT | 30 minutes |
| AP | Email/Password + OTP → JWT | 30 minutes |
| Supplier | Access Token (URL) → JWT | 2 hours |

### 2.2 JWT Session Token

All authenticated requests require a JWT session token stored in an HTTP-only cookie named `session`.

#### Token Structure

```json
{
  "userId": "string",
  "email": "string",
  "role": "admin | ap | supplier",
  "supplierId": "string (optional)",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 2.3 Session Cookie

| Property | Value |
|----------|-------|
| Name | `session` |
| HttpOnly | `true` |
| Secure | `true` (production) |
| SameSite | `lax` |
| Path | `/` |
| MaxAge | 1800 (Admin/AP) or 7200 (Supplier) |

### 2.4 Protected Routes

The middleware protects the following route patterns:

```typescript
// Admin routes - require 'admin' role
/admin/*

// AP routes - require 'ap' role
/ap/*

// Supplier routes - require 'supplier' role
/supplier/*  (except /supplier/access)
```

---

## 3. Request & Response Format

### 3.1 Request Headers

```http
Content-Type: application/json
Cookie: session=<jwt_token>
```

For file uploads:
```http
Content-Type: multipart/form-data
Cookie: session=<jwt_token>
```

### 3.2 Standard Response Format

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### 3.3 Pagination (where applicable)

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 4. Error Handling

### 4.1 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Internal Server Error | Server-side error |

### 4.2 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token missing |
| `AUTH_INVALID` | Authentication token invalid or expired |
| `AUTH_FORBIDDEN` | User doesn't have required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Requested resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `DATABASE_ERROR` | Database operation failed |
| `FILE_UPLOAD_ERROR` | File upload failed |
| `EMAIL_SEND_ERROR` | Email delivery failed |

### 4.3 Error Response Examples

```json
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}

// 400 Bad Request
{
  "success": false,
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR"
}

// 404 Not Found
{
  "success": false,
  "error": "Supplier not found",
  "code": "NOT_FOUND"
}
```

---

## 5. API Endpoints

### 5.1 Authentication APIs

---

#### POST /api/auth/admin/login

Authenticate an admin user with username and password.

**Request Body:**

```json
{
  "username": "admin01",
  "password": "Mining@2025"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin01",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Side Effects:**
- Sets `session` cookie with JWT token

---

#### POST /api/auth/admin/logout

Log out the current admin user.

**Request:** No body required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Side Effects:**
- Clears `session` cookie

---

#### POST /api/auth/ap/login

Initiate AP user login (Step 1: Validate credentials).

**Request Body:**

```json
{
  "email": "ap@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP sent to email",
  "requiresOtp": true
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Side Effects:**
- Generates 6-digit OTP
- Stores OTP in database (10-minute expiry)
- Sends OTP email via Azure Communication Services

---

#### POST /api/auth/ap/verify-otp

Complete AP user login (Step 2: Verify OTP).

**Request Body:**

```json
{
  "email": "ap@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "ap@example.com",
    "role": "ap"
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

**Side Effects:**
- Sets `session` cookie with JWT token
- Marks OTP as used in database

---

#### POST /api/auth/ap/logout

Log out the current AP user.

**Request:** No body required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /api/auth/supplier/verify

Verify a supplier access token and create session.

**Request Body:**

```json
{
  "token": "abc123def456..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "supplier": {
    "supplier_id": 1,
    "company_name": "ABC Supplies",
    "email": "supplier@example.com",
    "status": "approved",
    "cession_status": "approved"
  },
  "redirectTo": "/supplier/dashboard"
}
```

**Response with Pending Cession:**

```json
{
  "success": true,
  "supplier": {
    "supplier_id": 1,
    "company_name": "ABC Supplies",
    "status": "pending",
    "cession_status": "pending"
  },
  "redirectTo": "/supplier/cession-agreement"
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid or expired access token"
}
```

**Side Effects:**
- Sets `session` cookie with supplier JWT token (2-hour duration)

---

#### POST /api/auth/supplier/logout

Log out the current supplier.

**Request:** No body required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5.2 Supplier APIs

---

#### GET /api/suppliers

Get list of all suppliers (Admin only).

**Authentication:** Admin JWT required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: `pending`, `approved`, `rejected` |
| search | string | Search by company name or email |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "supplier_id": 1,
      "company_name": "ABC Supplies",
      "contact_person": "John Doe",
      "email": "john@abc.com",
      "phone": "+27123456789",
      "status": "approved",
      "cession_status": "approved",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

#### GET /api/suppliers/:id

Get a specific supplier by ID (Admin only).

**Authentication:** Admin JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Supplier ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "supplier_id": 1,
    "company_name": "ABC Supplies",
    "contact_person": "John Doe",
    "email": "john@abc.com",
    "phone": "+27123456789",
    "vat_number": "4673016401",
    "address": "123 Main St, Johannesburg",
    "bank_name": "First National Bank",
    "bank_branch_code": "250655",
    "bank_account_number": "1234567890",
    "bank_swift": "FIRNZAJJ",
    "status": "approved",
    "cession_status": "approved",
    "cession_document_url": "https://storage.blob.core.windows.net/...",
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-02T15:30:00Z"
  }
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "error": "Supplier not found"
}
```

---

#### PUT /api/suppliers/:id/approve

Approve a supplier application (Admin only).

**Authentication:** Admin JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Supplier ID |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Supplier approved successfully",
  "data": {
    "supplier_id": 1,
    "status": "approved",
    "approved_at": "2024-12-03T10:00:00Z"
  }
}
```

**Side Effects:**
- Updates supplier status to `approved`
- Generates new access token (14-day expiry)
- Sends approval email with dashboard access link
- Auto-generates offers for any matched invoices

---

#### PUT /api/suppliers/:id/reject

Reject a supplier application (Admin only).

**Authentication:** Admin JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Supplier ID |

**Request Body:**

```json
{
  "reason": "Incomplete documentation"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Supplier rejected",
  "data": {
    "supplier_id": 1,
    "status": "rejected"
  }
}
```

---

### 5.3 Invoice APIs

---

#### GET /api/invoices

Get list of all invoices.

**Authentication:** Admin or AP JWT required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| vendor_id | number | Filter by vendor |
| supplier_id | number | Filter by supplier |
| status | string | Filter by status |
| from_date | string | Start date (YYYY-MM-DD) |
| to_date | string | End date (YYYY-MM-DD) |
| page | number | Page number |
| limit | number | Items per page |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "invoice_id": 1,
      "invoice_number": "INV-2024-001",
      "vendor_code": "VND001",
      "vendor_name": "ABC Supplies",
      "amount": 50000.00,
      "currency": "ZAR",
      "due_date": "2024-12-31",
      "status": "offered",
      "offer_count": 1,
      "created_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/invoices/upload

Upload invoices from CSV (AP only).

**Authentication:** AP JWT required

**Request Body (multipart/form-data):**

| Field | Type | Description |
|-------|------|-------------|
| file | File | CSV file with invoice data |

**CSV Format:**

```csv
Company Code,Vendor Number,Vendor Name,Document Number,Document Type,Document Date,Posting Date,Baseline Date,Net Due Date,Days Overdue,Amount (Doc Curr),Currency,Amount (Local Curr),Payment Terms,Payment Method,Assignment (PO #),Reference (Invoice #),Open Item,Text
2000,200001,ABC Supplies,19000001,KR,2024-12-01,2024-12-01,2024-12-01,2024-12-31,-30,50000.00,ZAR,50000.00,0002 (45 days),T (EFT),PO001,INV-001,Yes,Services
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Invoices uploaded successfully",
  "summary": {
    "total": 50,
    "created": 45,
    "updated": 3,
    "skipped": 2,
    "errors": []
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid CSV format",
  "details": [
    "Row 5: Missing required field 'Amount'"
  ]
}
```

---

#### GET /api/invoices/:id

Get a specific invoice by ID.

**Authentication:** Admin, AP, or matching Supplier JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Invoice ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "invoice_id": 1,
    "invoice_number": "INV-2024-001",
    "vendor_code": "VND001",
    "vendor_name": "ABC Supplies",
    "supplier_id": 1,
    "amount": 50000.00,
    "currency": "ZAR",
    "due_date": "2024-12-31",
    "payment_terms": "45 days",
    "status": "offered",
    "description": "IT Services",
    "offers": [
      {
        "offer_id": 1,
        "offer_amount": 48750.00,
        "discount_rate": 2.5,
        "status": "pending",
        "created_at": "2024-12-01T10:00:00Z"
      }
    ]
  }
}
```

---

### 5.4 Payment APIs

---

#### GET /api/payments

Get list of all payments.

**Authentication:** Admin JWT required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| supplier_id | number | Filter by supplier |
| status | string | Filter by status: `pending`, `completed`, `failed` |
| from_date | string | Start date |
| to_date | string | End date |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "payment_id": 1,
      "supplier_id": 1,
      "supplier_name": "ABC Supplies",
      "amount": 48750.00,
      "currency": "ZAR",
      "status": "completed",
      "reference": "PAY-2024-001",
      "bank_reference": "FNB123456",
      "created_at": "2024-12-01T10:00:00Z",
      "processed_at": "2024-12-02T14:00:00Z"
    }
  ]
}
```

---

#### POST /api/payments

Create a new payment (Admin only).

**Authentication:** Admin JWT required

**Request Body:**

```json
{
  "supplier_id": 1,
  "offer_id": 1,
  "amount": 48750.00,
  "currency": "ZAR"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "payment_id": 1,
    "reference": "PAY-2024-001",
    "status": "pending",
    "amount": 48750.00
  }
}
```

---

#### PUT /api/payments/:id/process

Mark a payment as processed (Admin only).

**Authentication:** Admin JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Payment ID |

**Request Body:**

```json
{
  "bank_reference": "FNB123456",
  "processed_date": "2024-12-02"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "payment_id": 1,
    "status": "completed",
    "processed_at": "2024-12-02T14:00:00Z"
  }
}
```

---

### 5.5 Cession Agreement APIs

---

#### GET /api/cession-agreement/template

Download the cession agreement template PDF.

**Authentication:** Supplier JWT required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| supplierId | number | Supplier ID (for pre-filling) |

**Response (200 OK):**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="cession-agreement.pdf"

[PDF Binary Data]
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "error": "Template not found"
}
```

---

#### POST /api/cession-agreement/upload

Upload a signed cession agreement.

**Authentication:** Supplier JWT required

**Request Body (multipart/form-data):**

| Field | Type | Description |
|-------|------|-------------|
| file | File | Signed PDF document (max 10MB) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Cession agreement uploaded successfully",
  "data": {
    "document_url": "https://storage.blob.core.windows.net/cession-agreements/...",
    "uploaded_at": "2024-12-01T10:00:00Z"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid file type. Only PDF files are accepted."
}
```

**Side Effects:**
- Uploads file to Azure Blob Storage (production) or local filesystem (development)
- Updates supplier `cession_document_url` in database
- Updates supplier `cession_status` to `pending`

---

#### GET /api/cession-agreement/:supplierId

Get cession agreement status for a supplier.

**Authentication:** Admin or matching Supplier JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| supplierId | number | Supplier ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "supplier_id": 1,
    "cession_status": "approved",
    "document_url": "https://storage.blob.core.windows.net/...",
    "submitted_at": "2024-12-01T10:00:00Z",
    "reviewed_at": "2024-12-02T14:00:00Z",
    "reviewed_by": "admin01"
  }
}
```

---

## 6. Server Actions

Server Actions are Next.js functions that execute on the server. They are used throughout the application for form submissions and data mutations.

### 6.1 Admin Actions

Located in: `lib/actions/admin.ts`

---

#### getDashboardMetrics()

Get admin dashboard statistics.

**Returns:**

```typescript
{
  totalSuppliers: number;
  totalInvoices: number;
  pendingApplications: number;
  totalReceived: number;
  acceptedOffers: number;
  pendingPayments: number;
}
```

---

#### approveSupplier(supplierId: number)

Approve a supplier application.

**Parameters:**
- `supplierId`: number - The supplier's ID

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

**Side Effects:**
- Updates supplier status to 'approved'
- Creates new access token
- Sends approval email

---

#### rejectSupplier(supplierId: number)

Reject a supplier application.

**Parameters:**
- `supplierId`: number - The supplier's ID

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

### 6.2 Invoice Actions

Located in: `lib/actions/invoices.ts`

---

#### uploadVendors(formData: FormData)

Upload vendor data from CSV.

**Parameters:**
- `formData`: FormData containing CSV file or text

**Returns:**

```typescript
{
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}
```

---

#### uploadInvoices(formData: FormData)

Upload invoice data from CSV.

**Parameters:**
- `formData`: FormData containing CSV file or text

**Returns:**

```typescript
{
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}
```

---

#### getInvoices(filters?: InvoiceFilters)

Get invoices with optional filters.

**Parameters:**
- `filters`: Optional filter object

**Returns:**

```typescript
Invoice[]
```

---

### 6.3 Supplier Actions

Located in: `lib/actions/suppliers.ts`

---

#### getSupplierProfile()

Get the current supplier's profile.

**Returns:**

```typescript
{
  supplier_id: number;
  company_name: string;
  email: string;
  status: string;
  cession_status: string;
  // ... other fields
}
```

---

#### getSupplierOffers()

Get all offers for the current supplier.

**Returns:**

```typescript
{
  offer_id: number;
  invoice_id: number;
  invoice_number: string;
  amount: number;
  offer_amount: number;
  discount_rate: number;
  status: string;
  expires_at: string;
}[]
```

---

#### acceptOffer(offerId: number)

Accept an early payment offer.

**Parameters:**
- `offerId`: number - The offer ID

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

#### rejectOffer(offerId: number, reason?: string)

Reject an early payment offer.

**Parameters:**
- `offerId`: number - The offer ID
- `reason`: string (optional) - Rejection reason

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

#### uploadCessionAgreement(formData: FormData)

Upload signed cession agreement.

**Parameters:**
- `formData`: FormData with PDF file

**Returns:**

```typescript
{
  success: boolean;
  documentUrl?: string;
  error?: string;
}
```

---

### 6.4 Payment Actions

Located in: `lib/actions/payments.ts`

---

#### getPayments(filters?: PaymentFilters)

Get payments with optional filters.

**Returns:**

```typescript
Payment[]
```

---

#### processPayment(paymentId: number, bankReference: string)

Mark a payment as processed.

**Parameters:**
- `paymentId`: number - The payment ID
- `bankReference`: string - Bank reference number

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

### 6.5 Report Actions

Located in: `lib/actions/reports.ts`

---

#### getSupplierReport(startDate: string, endDate: string)

Generate supplier activity report.

**Returns:**

```typescript
{
  suppliers: number;
  totalOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  totalValue: number;
  data: ReportRow[];
}
```

---

#### getInvoiceReport(startDate: string, endDate: string)

Generate invoice summary report.

**Returns:**

```typescript
{
  totalInvoices: number;
  totalValue: number;
  byStatus: { status: string; count: number; value: number }[];
  data: ReportRow[];
}
```

---

## 7. Data Models

### 7.1 User

```typescript
interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'ap';
  created_at: Date;
  updated_at: Date;
}
```

### 7.2 Supplier

```typescript
interface Supplier {
  supplier_id: number;
  vendor_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  vat_number: string;
  bank_country: string;
  bank_name: string;
  bank_branch_code: string;
  bank_account_number: string;
  bank_iban: string;
  bank_swift: string;
  payment_method: string;
  payment_terms: string;
  status: 'pending' | 'approved' | 'rejected';
  cession_status: 'pending' | 'approved' | 'rejected';
  cession_document_url: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### 7.3 Vendor

```typescript
interface Vendor {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  company_code: string;
  created_at: Date;
}
```

### 7.4 Invoice

```typescript
interface Invoice {
  invoice_id: number;
  vendor_id: number;
  supplier_id: number | null;
  invoice_number: string;
  document_type: string;
  document_date: Date;
  posting_date: Date;
  baseline_date: Date;
  due_date: Date;
  days_overdue: number;
  amount: number;
  currency: string;
  amount_local: number;
  payment_terms: string;
  payment_method: string;
  po_number: string;
  reference: string;
  description: string;
  status: 'pending' | 'matched' | 'offered' | 'accepted' | 'rejected' | 'paid';
  created_at: Date;
  updated_at: Date;
}
```

### 7.5 Offer

```typescript
interface Offer {
  offer_id: number;
  invoice_id: number;
  supplier_id: number;
  offer_amount: number;
  discount_amount: number;
  discount_rate: number;
  days_to_maturity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: Date;
  accepted_at: Date | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
}
```

### 7.6 Payment

```typescript
interface Payment {
  payment_id: number;
  supplier_id: number;
  offer_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
  bank_reference: string | null;
  created_at: Date;
  processed_at: Date | null;
}
```

### 7.7 AccessToken

```typescript
interface AccessToken {
  token_id: number;
  supplier_id: number;
  token: string;
  token_type: 'welcome' | 'approval';
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}
```

### 7.8 AuditLog

```typescript
interface AuditLog {
  log_id: number;
  user_id: number | null;
  supplier_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}
```

---

## 8. Rate Limiting

### 8.1 Current Limits

The API currently does not implement explicit rate limiting. However, the following soft limits are recommended:

| Endpoint Type | Recommended Limit |
|---------------|-------------------|
| Authentication | 10 requests/minute |
| File Uploads | 5 requests/minute |
| Read Operations | 100 requests/minute |
| Write Operations | 30 requests/minute |

### 8.2 Large File Uploads

For CSV uploads:
- Maximum file size: 10MB
- Maximum rows per upload: 10,000

For PDF uploads:
- Maximum file size: 10MB

### 8.3 Response Headers

Currently not implemented, but planned:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## 9. Changelog

### Version 1.0.0 (December 2025)

**Initial Release**

- Authentication APIs for Admin, AP, and Supplier users
- Supplier management endpoints
- Invoice upload and management
- Offer creation and acceptance workflow
- Payment processing
- Cession agreement upload via Azure Blob Storage
- Email notifications via Azure Communication Services

### Planned Features

- [ ] API key authentication for external integrations
- [ ] Webhook notifications
- [ ] Bulk payment processing
- [ ] Advanced reporting endpoints
- [ ] Rate limiting implementation
- [ ] OpenAPI/Swagger documentation export

---

## Appendix A: CSV Templates

### Vendor CSV Template

```csv
Company Code,Vendor Number,Vendor Name,Address,Contact Person,Contact Email,Contact Phone,Bank Country,Bank Name,Bank Key (Branch Code),Bank Account Number,IBAN,SWIFT/BIC,Default Payment Method,Default Payment Terms,VAT Registration No,Reconciliation G/L Account
1000,200001,Sample Company,123 Main St,John Doe,john@sample.com,+27123456789,ZA,First National Bank,250655,1234567890,,FIRNZAJJ,T (EFT),0002 (45 days),1234567890,200000
```

### Invoice CSV Template

```csv
Company Code,Vendor Number,Vendor Name,Document Number,Document Type,Document Date,Posting Date,Baseline Date,Net Due Date,Days Overdue,Amount (Doc Curr),Currency,Amount (Local Curr),Payment Terms,Payment Method,Assignment (PO #),Reference (Invoice #),Open Item,Text
2000,200001,Sample Company,19000001,KR,2024-12-01,2024-12-01,2024-12-01,2024-12-31,-30,50000.00,ZAR,50000.00,0002 (45 days),T (EFT),PO001,INV-001,Yes,Services rendered
```

---

## Appendix B: Environment Variables

Required environment variables for API operation:

```env
# Database
DATABASE_HOST=your-mysql-server.mysql.database.azure.com
DATABASE_PORT=3306
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=scf_platform

# Authentication
JWT_SECRET=your-jwt-secret-key

# Azure Communication Services (Email)
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...
AZURE_COMMUNICATION_SENDER_EMAIL=noreply@yourdomain.com

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_STORAGE_CONTAINER_NAME=cession-agreements

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Appendix C: Testing the API

### Using cURL

```bash
# Login as Admin
curl -X POST https://your-domain.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin01","password":"Mining@2025"}' \
  -c cookies.txt

# Get Suppliers (using session cookie)
curl -X GET https://your-domain.com/api/suppliers \
  -b cookies.txt

# Upload Invoices
curl -X POST https://your-domain.com/api/invoices/upload \
  -b cookies.txt \
  -F "file=@invoices.csv"
```

### Using JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin01', password: 'Mining@2025' }),
  credentials: 'include'
});

// Get Suppliers
const suppliersResponse = await fetch('/api/suppliers', {
  credentials: 'include'
});
const suppliers = await suppliersResponse.json();
```

---

## Document Information

| Property | Value |
|----------|-------|
| Document Title | SCF Platform API Documentation |
| Version | 1.0 |
| Created | December 2025 |
| Author | SCF Platform Team |
| Classification | Internal / Developer |

---

*© 2025 Future Cashflow (Pty) Ltd. All rights reserved.*
