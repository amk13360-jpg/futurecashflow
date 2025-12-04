-- FMF Supply Chain Finance Platform - Phase 1 Schema Updates
-- Run this script to add missing tables and columns for Phase 1 features
-- Date: 2025-12-04

USE fmf_scf_platform;

-- ============================================
-- 1. OFFER BATCHES - Group offers per supplier
-- ============================================
CREATE TABLE IF NOT EXISTS offer_batches (
  batch_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  buyer_id INT NOT NULL,
  total_invoice_amount DECIMAL(15,2),
  total_discount_amount DECIMAL(15,2),
  total_net_payment DECIMAL(15,2),
  invoice_count INT DEFAULT 0,
  status ENUM('draft','pending_review','sent','partial_accepted','accepted','expired','cancelled') DEFAULT 'draft',
  send_mode ENUM('auto','review','scheduled') DEFAULT 'review',
  scheduled_send_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Add batch_id to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS batch_id INT NULL;
ALTER TABLE offers ADD CONSTRAINT fk_offers_batch 
  FOREIGN KEY (batch_id) REFERENCES offer_batches(batch_id) ON DELETE SET NULL;

-- ============================================
-- 2. TRUSTED DEVICES - Remember me for 30 days
-- ============================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  device_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  trusted_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_fingerprint (device_fingerprint),
  INDEX idx_trusted_until (trusted_until)
) ENGINE=InnoDB;

-- ============================================
-- 3. STANDING CESSION ENHANCEMENTS
-- ============================================
ALTER TABLE cession_agreements ADD COLUMN IF NOT EXISTS is_standing BOOLEAN DEFAULT FALSE;
ALTER TABLE cession_agreements ADD COLUMN IF NOT EXISTS standing_valid_until DATE NULL;
ALTER TABLE cession_agreements ADD COLUMN IF NOT EXISTS parent_cession_id INT NULL;
ALTER TABLE cession_agreements ADD COLUMN IF NOT EXISTS trigger_reason TEXT NULL;
ALTER TABLE cession_agreements ADD COLUMN IF NOT EXISTS buyer_id INT NULL;
ALTER TABLE cession_agreements ADD COLUMN IF NOT EXISTS linked_invoice_ids JSON NULL;

-- Add foreign keys for cession enhancements
ALTER TABLE cession_agreements ADD CONSTRAINT fk_parent_cession 
  FOREIGN KEY (parent_cession_id) REFERENCES cession_agreements(cession_id) ON DELETE SET NULL;
ALTER TABLE cession_agreements ADD CONSTRAINT fk_cession_buyer 
  FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE SET NULL;

-- ============================================
-- 4. SHORT CODES FOR SUPPLIER TOKENS
-- ============================================
ALTER TABLE supplier_tokens ADD COLUMN IF NOT EXISTS short_code VARCHAR(8) NULL;
ALTER TABLE supplier_tokens ADD INDEX idx_short_code (short_code);

-- Update token_type enum to include 'approval'
ALTER TABLE supplier_tokens 
  MODIFY COLUMN token_type ENUM('invite','reset_password','offer_access','approval') DEFAULT 'invite';

-- ============================================
-- 5. NOTIFICATION RULES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_rules (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  recipient_type ENUM('admin','ap_user','supplier','buyer_contact') NOT NULL,
  channel ENUM('email','sms','in_app') DEFAULT 'email',
  template_key VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  conditions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trigger_event (trigger_event),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- 6. EMAIL TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  template_id INT AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 7. SEED DEFAULT NOTIFICATION RULES
-- ============================================
INSERT IGNORE INTO notification_rules (rule_name, trigger_event, recipient_type, channel, template_key) VALUES
  ('Supplier Welcome', 'supplier_created', 'supplier', 'email', 'supplier_welcome'),
  ('Supplier Approved', 'supplier_approved', 'supplier', 'email', 'supplier_approved'),
  ('Offer Sent', 'offer_sent', 'supplier', 'email', 'offer_notification'),
  ('Offer Accepted', 'offer_accepted', 'admin', 'email', 'offer_accepted_admin'),
  ('Payment Completed', 'payment_completed', 'supplier', 'email', 'payment_confirmation'),
  ('Bank Change Request', 'bank_change_requested', 'admin', 'email', 'bank_change_alert'),
  ('Cession Uploaded', 'cession_uploaded', 'admin', 'email', 'cession_review_needed'),
  ('Offer Expiring Soon', 'offer_expiring', 'supplier', 'email', 'offer_reminder');

-- ============================================
-- 8. SEED DEFAULT EMAIL TEMPLATES
-- ============================================
INSERT IGNORE INTO email_templates (template_key, template_name, subject, body_html, variables) VALUES
  ('supplier_welcome', 'Supplier Welcome Email', 
   'Action Required: Sign Your Cession Agreement - Future Cashflow',
   '<h1>Welcome to Future Cashflow</h1><p>Dear {{supplier_name}},</p><p>You have been invited to join our supply chain finance platform.</p><p><a href="{{access_link}}">Click here to sign your cession agreement</a></p>',
   '["supplier_name", "access_link", "buyer_name"]'),
  
  ('supplier_approved', 'Supplier Approval Email',
   '🎉 Your Application Has Been Approved - Future Cashflow',
   '<h1>Congratulations!</h1><p>Dear {{supplier_name}},</p><p>Your application has been approved. You can now view and accept early payment offers.</p><p><a href="{{access_link}}">Access Your Dashboard</a></p>',
   '["supplier_name", "access_link"]'),
  
  ('offer_notification', 'New Offer Available',
   'New Early Payment Offer Available - Future Cashflow',
   '<h1>New Offer</h1><p>Dear {{supplier_name}},</p><p>You have a new early payment offer for {{invoice_count}} invoice(s) totaling {{total_amount}}.</p><p><a href="{{access_link}}">View Offer</a></p>',
   '["supplier_name", "invoice_count", "total_amount", "access_link"]'),
  
  ('offer_reminder', 'Offer Expiring Soon',
   'Reminder: Your Early Payment Offer Expires Soon - Future Cashflow',
   '<h1>Offer Expiring</h1><p>Dear {{supplier_name}},</p><p>Your early payment offer expires on {{expiry_date}}. Please review and accept before it expires.</p><p><a href="{{access_link}}">Review Offer</a></p>',
   '["supplier_name", "expiry_date", "access_link"]'),
  
  ('payment_confirmation', 'Payment Confirmation',
   'Payment Completed - Future Cashflow',
   '<h1>Payment Sent</h1><p>Dear {{supplier_name}},</p><p>A payment of {{amount}} has been sent to your bank account.</p><p>Reference: {{payment_reference}}</p>',
   '["supplier_name", "amount", "payment_reference", "bank_account"]');

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
-- New Tables:
--   - offer_batches: Group offers by supplier for batch operations
--   - trusted_devices: Support "Remember me for 30 days" feature
--   - notification_rules: Configurable notification triggers
--   - email_templates: Customizable email templates
--
-- Modified Tables:
--   - offers: Added batch_id for grouping
--   - cession_agreements: Added standing cession support
--   - supplier_tokens: Added short_code for easy access
