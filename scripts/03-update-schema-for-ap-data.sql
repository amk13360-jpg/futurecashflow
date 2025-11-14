-- Update schema to match the actual AP Data CSV structure
USE fmf_scf_platform;

-- Add new columns to invoices table to store all AP Data fields
ALTER TABLE invoices
ADD COLUMN  company_code VARCHAR(20),
ADD COLUMN  vendor_number VARCHAR(50),
ADD COLUMN  document_number VARCHAR(100),
ADD COLUMN  document_type VARCHAR(10),
ADD COLUMN document_date DATE,
ADD COLUMN  posting_date DATE,
ADD COLUMN  baseline_date DATE,
ADD COLUMN  net_due_date DATE,
ADD COLUMN  days_overdue INT,
ADD COLUMN  amount_doc_curr DECIMAL(15, 2),
ADD COLUMN amount_local_curr DECIMAL(15, 2),
ADD COLUMN payment_terms VARCHAR(100),
ADD COLUMN  payment_method VARCHAR(50),
ADD COLUMN  assignment_po VARCHAR(100),
ADD COLUMN  reference_invoice VARCHAR(100),
ADD COLUMN  open_item VARCHAR(10),
ADD COLUMN  text_description TEXT;

-- Add index for vendor_number for faster lookups
ALTER TABLE invoices ADD INDEX  idx_vendor_number (vendor_number);
ALTER TABLE invoices ADD INDEX  idx_document_number (document_number);

-- Update suppliers table to store vendor data fields
ALTER TABLE suppliers
ADD COLUMN vendor_number VARCHAR(50) UNIQUE,
ADD COLUMN  company_code VARCHAR(20),
ADD COLUMN address TEXT,
ADD COLUMN bank_country VARCHAR(2) DEFAULT 'ZA',
ADD COLUMN  bank_key_branch_code VARCHAR(20),
ADD COLUMN  iban VARCHAR(50),
ADD COLUMN  swift_bic VARCHAR(20),
ADD COLUMN  default_payment_method VARCHAR(50),
ADD COLUMN  default_payment_terms VARCHAR(100),
ADD COLUMN  reconciliation_gl_account VARCHAR(50);

-- Add index for vendor_number
ALTER TABLE suppliers ADD INDEX idx_vendor_number (vendor_number);