-- FMF Supply Chain Finance Platform - Database Schema
-- MySQL Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS fmf_scf_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fmf_scf_platform;

-- Table: buyers (mining companies)
CREATE TABLE IF NOT EXISTS buyers (
  buyer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  active_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active_status (active_status)
) ENGINE=InnoDB;

-- Table: suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vat_no VARCHAR(50) UNIQUE,
  registration_no VARCHAR(100),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  physical_address TEXT,
  bank_name VARCHAR(100),
  bank_account_no VARCHAR(50),
  bank_branch_code VARCHAR(20),
  bank_account_type ENUM('current', 'savings', 'business') DEFAULT 'business',
  risk_tier ENUM('low', 'medium', 'high') DEFAULT 'medium',
  onboarding_status ENUM('pending', 'documents_submitted', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  active_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vat_no (vat_no),
  INDEX idx_onboarding_status (onboarding_status),
  INDEX idx_active_status (active_status)
) ENGINE=InnoDB;

-- Table: users (admin and AP users)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'accounts_payable', 'auditor') NOT NULL,
  buyer_id INT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  active_status ENUM('active', 'inactive', 'locked') DEFAULT 'active',
  failed_login_attempts INT DEFAULT 0,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- Table: supplier_tokens (for secure supplier access)
CREATE TABLE IF NOT EXISTS supplier_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  token_type ENUM('invite', 'reset_password', 'offer_access') DEFAULT 'invite',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Table: otp_codes (for AP user authentication)
CREATE TABLE IF NOT EXISTS otp_codes (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Table: invoices
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  supplier_id INT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  description TEXT,
  status ENUM('pending', 'matched', 'offered', 'accepted', 'paid', 'rejected') DEFAULT 'pending',
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE KEY unique_invoice (buyer_id, invoice_number),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB;

-- Table: offers
CREATE TABLE IF NOT EXISTS offers (
  offer_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  supplier_id INT NOT NULL,
  buyer_id INT NOT NULL,
  annual_rate DECIMAL(5, 2) NOT NULL,
  days_to_maturity INT NOT NULL,
  discount_amount DECIMAL(15, 2) NOT NULL,
  net_payment_amount DECIMAL(15, 2) NOT NULL,
  offer_expiry_date TIMESTAMP NOT NULL,
  status ENUM('sent', 'opened', 'accepted', 'rejected', 'expired') DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP NULL,
  responded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_offer_expiry_date (offer_expiry_date)
) ENGINE=InnoDB;

-- Table: cession_agreements
CREATE TABLE IF NOT EXISTS cession_agreements (
  cession_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  document_url VARCHAR(500),
  document_type ENUM('uploaded', 'digitally_signed') DEFAULT 'uploaded',
  version VARCHAR(20) DEFAULT '1.0',
  signed_date DATE,
  signature_data TEXT,
  status ENUM('pending', 'signed', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  offer_id INT NOT NULL,
  supplier_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  payment_reference VARCHAR(100) UNIQUE,
  payment_method ENUM('eft', 'bank_transfer', 'other') DEFAULT 'eft',
  status ENUM('queued', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
  scheduled_date DATE,
  completed_date DATE NULL,
  batch_id VARCHAR(100),
  processed_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offers(offer_id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_batch_id (batch_id),
  INDEX idx_scheduled_date (scheduled_date)
) ENGINE=InnoDB;

-- Table: repayments
CREATE TABLE IF NOT EXISTS repayments (
  repayment_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  buyer_id INT NOT NULL,
  expected_amount DECIMAL(15, 2) NOT NULL,
  received_amount DECIMAL(15, 2) DEFAULT 0,
  due_date DATE NOT NULL,
  received_date DATE NULL,
  status ENUM('pending', 'partial', 'completed', 'overdue') DEFAULT 'pending',
  reconciliation_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_type ENUM('admin', 'accounts_payable', 'supplier', 'system') NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_type ENUM('supplier', 'user') NOT NULL,
  recipient_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  channel ENUM('email', 'sms', 'in_app') DEFAULT 'email',
  status ENUM('pending', 'sent', 'failed', 'read') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient (recipient_type, recipient_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Table: bank_change_requests
CREATE TABLE IF NOT EXISTS bank_change_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  old_bank_name VARCHAR(100),
  old_account_no VARCHAR(50),
  new_bank_name VARCHAR(100) NOT NULL,
  new_account_no VARCHAR(50) NOT NULL,
  new_branch_code VARCHAR(20) NOT NULL,
  new_account_type ENUM('current', 'savings', 'business') DEFAULT 'business',
  reason TEXT,
  supporting_document_url VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Table: system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  setting_id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;
