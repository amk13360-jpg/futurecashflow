# Future Cashflow - Supply Chain Finance Platform
## Comprehensive User Guide

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Getting Started](#3-getting-started)
4. [Accounts Payable (AP) User Guide](#4-accounts-payable-ap-user-guide)
5. [Supplier User Guide](#5-supplier-user-guide)
6. [Administrator User Guide](#6-administrator-user-guide)
7. [Email Notifications](#7-email-notifications)
8. [Troubleshooting](#8-troubleshooting)
9. [Glossary](#9-glossary)

---

## 1. Introduction

### About Future Cashflow

Future Cashflow is a **Supply Chain Finance (SCF) Platform** designed specifically for the mining industry. The platform enables suppliers to receive early payments on their approved invoices at a discount, while buyers (mining companies) can extend their payment terms.

### Key Benefits

| Stakeholder | Benefits |
|-------------|----------|
| **Suppliers** | Access to early payment, improved cash flow, reduced borrowing costs |
| **Buyers (Mining Companies)** | Extended payment terms, stronger supplier relationships |
| **Platform** | Facilitates secure, transparent transactions between parties |

### Platform URL

- **Production**: `https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net`

---

## 2. System Overview

### User Roles

The platform supports three distinct user roles:

| Role | Description | Access Point |
|------|-------------|--------------|
| **Administrator** | Full platform control, user management, approvals | `/login/admin` |
| **Accounts Payable (AP)** | Upload vendors and invoices, manage AP data | `/login/ap` |
| **Supplier** | View offers, accept early payments, manage profile | `/supplier/access` |

### System Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FUTURE CASHFLOW WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. AP UPLOADS VENDORS                                                       │
│     ↓                                                                        │
│  2. SYSTEM SENDS WELCOME EMAIL (Sign Cession Agreement)                     │
│     ↓                                                                        │
│  3. SUPPLIER SIGNS & UPLOADS CESSION AGREEMENT                              │
│     ↓                                                                        │
│  4. ADMIN REVIEWS & APPROVES SUPPLIER                                       │
│     ↓                                                                        │
│  5. SYSTEM SENDS APPROVAL EMAIL (Access Dashboard)                          │
│     ↓                                                                        │
│  6. AP UPLOADS INVOICES                                                      │
│     ↓                                                                        │
│  7. SYSTEM AUTO-GENERATES OFFERS FOR APPROVED SUPPLIERS                     │
│     ↓                                                                        │
│  8. SUPPLIER REVIEWS & ACCEPTS/REJECTS OFFERS                               │
│     ↓                                                                        │
│  9. ADMIN PROCESSES PAYMENTS                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Getting Started

### Home Page

When you visit the platform, you'll see the **Future Cashflow** landing page with two login options:

- **Admin Login** - For platform administrators
- **AP Login** - For Accounts Payable users

Suppliers access the platform via the unique access link sent to their email.

### Browser Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Cookies enabled for session management

### Theme Support

The platform supports both **Light** and **Dark** modes. Use the theme toggle (sun/moon icon) in the top-right corner to switch themes.

---

## 4. Accounts Payable (AP) User Guide

### 4.1 Logging In

1. Navigate to the home page
2. Click **"AP Login"**
3. Enter your credentials:
   - **Mine Code**: Your company's unique identifier
   - **Password**: Your secure password
4. Click **"Sign In"**
5. You'll receive a **One-Time Password (OTP)** via email
6. Enter the OTP to complete authentication
7. You'll be redirected to the **AP Dashboard**

> **Note**: OTP expires in 10 minutes. If you don't receive it, check your spam folder or contact your administrator.

### 4.2 AP Dashboard Overview

The AP Dashboard displays:

| Metric | Description |
|--------|-------------|
| **Total Invoices** | Number of invoices you've uploaded |
| **Pending Offers** | Invoices waiting for supplier response |
| **Total Value** | Combined value of all uploaded invoices |

### 4.3 Quick Actions

The dashboard provides four action cards:

1. **Upload Vendors** - Upload vendor master data
2. **Upload Invoices** - Upload AP invoice data
3. **View Invoices** - See all uploaded invoices
4. **View Reports** - Access analytics and reports

---

### 4.4 Uploading Vendors (MUST DO FIRST)

> ⚠️ **Important**: You must upload vendors BEFORE uploading invoices. Invoices are matched to vendors by Vendor Number.

#### Step-by-Step Process:

1. From the AP Dashboard, click **"Upload Vendors"**
2. Prepare your CSV file with the required columns
3. Either:
   - Click **"Upload CSV File"** and select your file, OR
   - Paste CSV data directly into the text area
4. Click **"Preview"** to validate the data
5. Review the preview (first 10 rows shown)
6. Click **"Upload Vendor Data"** to submit

#### Required CSV Columns:

```
Company Code, Vendor Number, Vendor Name, Address, Contact Person, 
Contact Email, Contact Phone, Bank Country, Bank Name, 
Bank Key (Branch Code), Bank Account Number, IBAN, SWIFT/BIC, 
Default Payment Method, Default Payment Terms, VAT Registration No, 
Reconciliation G/L Account
```

#### Example CSV Row:

```csv
1000,200008,Marumo Construction,707 Main Rd Rustenburg,Palesa Mahlangu,info@marumo-construction.co.za,+27 780 450 9862,ZA,First National Bank,250655,8166292195,,FIRNZAJJ,T (EFT),0002 (45 days),4673016401,200000
```

#### What Happens After Upload:

- **New suppliers** are created in the system with status `pending`
- **Existing suppliers** have their details updated
- **Invitation emails** are automatically sent to NEW suppliers only
- The email contains a link to sign the cession agreement

---

### 4.5 Uploading Invoices

#### Prerequisites:
- Vendors must be uploaded first
- Only "Open Items" are processed

#### Step-by-Step Process:

1. From the AP Dashboard, click **"Upload Invoices"**
2. Prepare your CSV file with the required columns
3. Either:
   - Click **"Upload CSV File"** and select your file, OR
   - Paste CSV data directly into the text area
4. Click **"Preview"** to validate the data
5. Review the preview (first 10 rows shown)
6. Click **"Upload AP Data"** to submit

#### Required CSV Columns:

```
Company Code, Vendor Number, Vendor Name, Document Number, Document Type, 
Document Date, Posting Date, Baseline Date, Net Due Date, Days Overdue, 
Amount (Doc Curr), Currency, Amount (Local Curr), Payment Terms, 
Payment Method, Assignment (PO #), Reference (Invoice #), Open Item, Text
```

#### Example CSV Row:

```csv
2000,200016,Shosholoza Logistics,19000300,KR,2025-08-25,2025-08-25,2025-08-25,2025-10-24,-64,9303.57,ZAR,9303.57,0003 (60 days),T (EFT),PO2100,INV-3100,Yes,IT support
```

> **Note**: Only rows with `Open Item = Yes` will be processed.

#### What Happens After Upload:

- Invoices are matched to suppliers by **Vendor Number**
- If a supplier is **approved**, offers are automatically generated
- Invoice status is set to `matched` or `offered`
- You'll see a summary of successful uploads and any errors

---

### 4.6 Viewing Invoices

1. From the AP Dashboard, click **"View Invoices"**
2. You'll see a table of all uploaded invoices with:
   - Document Number
   - Vendor Name
   - Amount
   - Currency
   - Due Date
   - Status
   - Offer Count

#### Invoice Statuses:

| Status | Description |
|--------|-------------|
| `matched` | Invoice matched to supplier, awaiting offer |
| `offered` | Offer sent to supplier |
| `accepted` | Supplier accepted the early payment offer |
| `rejected` | Supplier rejected the offer |

---

## 5. Supplier User Guide

### 5.1 Getting Started as a Supplier

As a supplier, you'll receive **two types of emails** during the onboarding process:

#### Email 1: Welcome Email (After Vendor Upload)

**Subject**: "Action Required: Sign Your Cession Agreement - Future Cashflow"

This email is sent when AP uploads your vendor data. It contains:
- Welcome message
- Link to access the portal
- Instructions to sign the cession agreement
- 14-day expiration notice

#### Email 2: Approval Email (After Admin Approval)

**Subject**: "🎉 Your Application Has Been Approved - Future Cashflow"

This email is sent when an administrator approves your application. It contains:
- Congratulations message
- Link to access your dashboard
- List of available features
- 14-day expiration notice

---

### 5.2 Signing the Cession Agreement

1. Click the link in your **Welcome Email**
2. You'll be taken to the **Supplier Access** page
3. Your access token is automatically verified
4. You'll see the **Cession Agreement Required** page
5. Click **"Download Template"** to get the agreement
6. Sign the agreement (physically or digitally)
7. Click **"Upload Signed Agreement"**
8. Select your signed PDF file
9. Click **"Submit Document"**

> **Important**: You cannot access offers or payments until your cession agreement is approved.

---

### 5.3 Accessing the Supplier Dashboard

#### After Approval:

1. Click the link in your **Approval Email**
2. You'll be automatically logged in
3. You'll see your **Supplier Dashboard**

#### Returning Users:

1. Go to `/supplier/access`
2. Enter your access token (from your email)
3. Click **"Verify Token"**

---

### 5.4 Supplier Dashboard Overview

The Supplier Dashboard displays:

| Metric | Description |
|--------|-------------|
| **Pending Offers** | Offers waiting for your decision |
| **Accepted Offers** | Offers you've accepted |
| **Total Received** | Total early payment amount received |
| **Status** | Your current onboarding status |

#### Alert Banner

If you haven't signed your cession agreement, you'll see a warning banner:

> ⚠️ **Action Required**: You must sign or upload your cession agreement before accessing offers or payments.

---

### 5.5 Viewing and Accepting Offers

1. From your Dashboard, go to the **"Offers"** tab
2. You'll see all pending early payment offers
3. Each offer shows:
   - Invoice Number
   - Buyer Name
   - Invoice Amount
   - Early Payment Amount (discounted)
   - Discount Amount & Annual Rate
   - Days to Maturity
   - Expiry Date

4. Click **"Review Offer"** to see details
5. Choose to **Accept** or **Reject** the offer

#### Offer Details Explained:

| Field | Description |
|-------|-------------|
| **Invoice Amount** | Original invoice value |
| **Early Payment Amount** | What you'll receive (after discount) |
| **Discount Amount** | Fee for early payment |
| **Annual Rate** | Annualized discount rate (e.g., 12.5%) |
| **Days to Maturity** | Days until original due date |
| **Offer Expiry** | Last day to accept this offer |

> **Example**: Invoice of R10,000 with 12.5% annual rate and 60 days to maturity:
> - Discount: R10,000 × 12.5% × 60/365 = R205.48
> - Early Payment: R10,000 - R205.48 = **R9,794.52**

---

### 5.6 Offer History

1. Go to the **"History"** tab
2. View all past offers with their status:
   - **Accepted** - You accepted the offer
   - **Rejected** - You rejected the offer
   - **Expired** - Offer expired without response

---

### 5.7 Payment History

1. Go to the **"Payments"** tab
2. Track all disbursements:
   - Payment Reference
   - Amount
   - Status (Scheduled, Completed)
   - Dates

---

### 5.8 Managing Your Profile

1. Go to the **"Profile"** tab
2. View your business information:
   - Company Name
   - VAT Number
   - Contact Email & Phone
   - Bank Details

3. To update bank details, click **"Request Bank Detail Change"**
   - This requires admin approval for security

---

## 6. Administrator User Guide

### 6.1 Logging In

1. Navigate to the home page
2. Click **"Admin Login"**
3. Enter your credentials:
   - **Username**: Your admin username
   - **Password**: Your secure password
4. Click **"Sign In"**
5. You'll be redirected to the **Admin Dashboard**

> **Default Credentials**: `admin01` / `Mining@2025` (change after first login)

---

### 6.2 Admin Dashboard Overview

The Admin Dashboard displays key metrics:

| Metric | Description |
|--------|-------------|
| **Pending Documents** | Cession agreements awaiting review |
| **Total Applications** | Suppliers in onboarding process |
| **Registered Suppliers** | Approved and active suppliers |
| **48h Payments Issued** | Payment value in last 48 hours |

---

### 6.3 Dashboard Tabs

#### Document Review Tab

Review pending cession agreements:

1. Click on the **"Document Review"** tab
2. See all pending cession agreements
3. For each document:
   - View supplier name and email
   - See submission date
   - Click **"View Document"** to open the PDF
   - Click **"Review"** to approve or reject

#### Applications Tab

Review supplier applications:

1. Click on the **"Applications"** tab
2. See all pending supplier applications
3. For each application:
   - View supplier details (Name, VAT, Email)
   - See current status
   - Click **"Review"** to approve or reject

#### Bank Changes Tab

Review bank detail change requests:

1. Click on the **"Bank Changes"** tab
2. See all pending bank change requests
3. For each request:
   - View current and new bank details
   - See reason for change
   - Approve or reject the request

#### Suppliers Tab

Manage all suppliers:

1. Click on the **"Suppliers"** tab
2. Click **"View All Suppliers"** for the full list
3. Filter and search suppliers
4. View supplier details and status

#### Payments Tab

Manage payments:

1. Click on the **"Payments"** tab
2. Click **"Manage Payments"**
3. Queue payments for processing
4. Generate payment batches
5. Track repayments

---

### 6.4 Reviewing Supplier Applications

1. Navigate to **Applications** tab or `/admin/applications`
2. Click **"Review"** on a pending application
3. Review supplier details:
   - Company information
   - Contact details
   - Bank details
   - Cession agreement status

4. Choose an action:
   - **Approve** - Supplier can access offers
   - **Reject** - Application denied
   - **Request More Info** - Set to pending

#### What Happens When You Approve:

1. Supplier status changes to `approved`
2. System generates offers for any matched invoices
3. A new access token is created (14-day expiry)
4. **Approval Email** is sent to the supplier
5. Supplier can now access their dashboard and view offers

---

### 6.5 Reviewing Cession Agreements

1. Navigate to **Document Review** tab
2. Click **"View Document"** to open the PDF
3. Verify the document is properly signed
4. Click **"Review"** to go to the review page
5. Choose **Approve** or **Reject**

> **Important**: Cession agreements are stored in Azure Blob Storage for persistence.

---

### 6.6 Quick Actions

The Admin Dashboard provides quick action cards:

| Action | Description |
|--------|-------------|
| **Invoice Management** | View and manage all uploaded invoices |
| **Reports & Logs** | Generate reports and view audit logs |
| **System Settings** | Configure rates, users, and parameters |

---

### 6.7 System Settings

Access system settings at `/admin/settings`:

- **Default Annual Rate** - Discount rate for offers (e.g., 12.5%)
- **Offer Expiry Days** - Days until offers expire (e.g., 7 days)
- **User Management** - Create and manage admin/AP users

---

## 7. Email Notifications

### Email Types

The platform sends automated emails via Azure Communication Services:

| Email Type | Trigger | Recipient | Purpose |
|------------|---------|-----------|---------|
| **OTP Email** | AP Login | AP User | Authentication |
| **Welcome Email** | Vendor Upload | New Supplier | Sign cession agreement |
| **Approval Email** | Admin Approval | Supplier | Access dashboard |

### Email Templates

#### OTP Email
- **Subject**: "Your OTP for Future Cashflow Platform"
- **Content**: 6-digit code, 10-minute expiry
- **Header**: Blue gradient with lock icon

#### Welcome Email (Cession Signing)
- **Subject**: "Action Required: Sign Your Cession Agreement"
- **Content**: 3-step instructions, access link
- **Header**: Blue gradient
- **Link Expiry**: 14 days

#### Approval Email (Dashboard Access)
- **Subject**: "🎉 Your Application Has Been Approved!"
- **Content**: Congratulations, feature list, access link
- **Header**: Green gradient (success theme)
- **Link Expiry**: 14 days

---

## 8. Troubleshooting

### Common Issues

#### "Access Token Invalid or Expired"

**Cause**: Your access link has expired (14-day limit)

**Solution**: Contact the AP department to re-upload your vendor data, which will generate a new token.

---

#### "Supplier Not Found for Vendor Number"

**Cause**: Invoice uploaded before vendor data

**Solution**: Upload vendor data first, then upload invoices.

---

#### "OTP Not Received"

**Causes**:
- Email in spam/junk folder
- Incorrect email address
- Email service delay

**Solutions**:
1. Check spam folder
2. Wait a few minutes
3. Contact administrator

---

#### "Cession Agreement Document Not Found (404)"

**Cause**: File storage issue (legacy local storage)

**Solution**: The platform now uses Azure Blob Storage. Re-upload the cession agreement.

---

#### "Access Denied" Error

**Cause**: Your account doesn't have permission for that action

**Solution**: Contact your administrator to verify your role and permissions.

---

#### Cannot See Offers

**Possible Causes**:
1. Cession agreement not signed/approved
2. Supplier application not approved
3. No invoices uploaded for your company
4. Invoices already past due date

**Solution**: Check your status in the Profile tab. Contact AP or Admin if needed.

---

### Contact Support

For technical issues, contact:
- **Email**: support@futurecashflow.co.za
- **Phone**: Contact your account manager

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **AP (Accounts Payable)** | Department responsible for managing supplier payments |
| **Cession Agreement** | Legal document transferring payment rights to the funder |
| **Days to Maturity** | Number of days until the original invoice due date |
| **Discount Amount** | Fee charged for early payment (deducted from invoice) |
| **Early Payment** | Receiving payment before the original due date |
| **Net Payment Amount** | Amount supplier receives after discount |
| **Offer** | Proposal for early payment at a specific discount rate |
| **Onboarding** | Process of registering and verifying a new supplier |
| **OTP** | One-Time Password for secure authentication |
| **SCF (Supply Chain Finance)** | Financial solution providing early payment to suppliers |
| **Vendor Number** | Unique identifier for suppliers in the ERP system |

---

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Last Updated** | December 2025 |
| **Platform** | Future Cashflow SCF Platform |
| **Company** | Future Cashflow (Pty) Ltd |
| **Registration** | NCRCP18174 |

---

© 2025 Future Cashflow (Pty) Ltd · All rights reserved
