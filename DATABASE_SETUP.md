# FMF SCF Platform - Database Setup Guide

## Prerequisites
- MySQL 8.0 or higher installed on localhost
- MySQL server running on port 3306

## Setup Instructions

### 1. Start MySQL Server
Make sure your MySQL server is running on localhost.

### 2. Run Database Schema Script
Execute the schema creation script:

\`\`\`bash
mysql -u root -p < scripts/01-create-database-schema.sql
\`\`\`

Or using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to localhost
3. Open `scripts/01-create-database-schema.sql`
4. Execute the script

### 3. Seed Initial Data
Execute the seed data script:

\`\`\`bash
mysql -u root -p < scripts/02-seed-initial-data.sql
\`\`\`

### 4. Configure Environment Variables
Copy `.env.local` and update with your MySQL credentials:

\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fmf_scf_platform
\`\`\`

### 5. Test Connection
The application will automatically test the database connection on startup.

## Default Credentials

### Admin User
- Username: `admin`
- Email: `admin@fmf.co.za`
- Password: `Admin@123` (change after first login)

### AP Users
- Anglo American: `aap_ap` / `Admin@123`
- Sibanye-Stillwater: `ssw_ap` / `Admin@123`
- Harmony Gold: `hgm_ap` / `Admin@123`

## Database Structure

The database includes the following main tables:
- `buyers` - Mining companies
- `suppliers` - Supplier information
- `users` - Admin and AP users
- `invoices` - Invoice data
- `offers` - Early payment offers
- `payments` - Payment tracking
- `repayments` - Buyer repayments
- `cession_agreements` - Legal agreements
- `audit_logs` - Complete audit trail
- `notifications` - Email/SMS notifications
- `bank_change_requests` - Supplier bank changes

## Security Notes

1. Change default passwords immediately
2. Use strong JWT_SECRET in production
3. Enable MySQL SSL connections in production
4. Implement proper backup strategy
5. Set up database user with limited privileges (not root)
