-- Migration: 05-buyer-onboarding-schema.sql
-- Date: 2025-12-04
-- Author: Development Team
-- Description: Buyer onboarding enhancements - adds profile fields, eligibility config,
--              rate cards, documents, and first-login user columns

-- ============================================================================
-- 1. ENHANCE BUYERS TABLE
-- ============================================================================

-- Add trading name (if different from legal name)
ALTER TABLE buyers ADD COLUMN trading_name VARCHAR(255) NULL AFTER name;

-- Add company registration details
ALTER TABLE buyers ADD COLUMN registration_no VARCHAR(100) NULL AFTER trading_name;
ALTER TABLE buyers ADD COLUMN tax_id VARCHAR(50) NULL AFTER registration_no;

-- Add industry classification and risk tier
ALTER TABLE buyers ADD COLUMN industry_sector ENUM('mining', 'manufacturing', 'retail', 'construction', 'agriculture', 'services', 'other') DEFAULT 'mining' AFTER tax_id;
ALTER TABLE buyers ADD COLUMN risk_tier ENUM('A', 'B', 'C') DEFAULT 'B' AFTER industry_sector;

-- Add physical address fields
ALTER TABLE buyers ADD COLUMN physical_address_street VARCHAR(255) NULL AFTER risk_tier;
ALTER TABLE buyers ADD COLUMN physical_address_city VARCHAR(100) NULL AFTER physical_address_street;
ALTER TABLE buyers ADD COLUMN physical_address_province VARCHAR(100) NULL AFTER physical_address_city;
ALTER TABLE buyers ADD COLUMN physical_address_postal VARCHAR(20) NULL AFTER physical_address_province;

-- Add contact fields
ALTER TABLE buyers ADD COLUMN primary_contact_name VARCHAR(255) NULL AFTER physical_address_postal;
ALTER TABLE buyers ADD COLUMN financial_contact_name VARCHAR(255) NULL AFTER contact_phone;
ALTER TABLE buyers ADD COLUMN financial_contact_email VARCHAR(255) NULL AFTER financial_contact_name;

-- Add invoice eligibility criteria (per-buyer configuration)
ALTER TABLE buyers ADD COLUMN min_invoice_amount DECIMAL(15,2) DEFAULT 1000.00 AFTER financial_contact_email;
ALTER TABLE buyers ADD COLUMN max_invoice_amount DECIMAL(15,2) DEFAULT 5000000.00 AFTER min_invoice_amount;
ALTER TABLE buyers ADD COLUMN min_days_to_maturity INT DEFAULT 7 AFTER max_invoice_amount;
ALTER TABLE buyers ADD COLUMN max_days_to_maturity INT DEFAULT 90 AFTER min_days_to_maturity;

-- Add financial tracking
ALTER TABLE buyers ADD COLUMN credit_limit DECIMAL(15,2) NULL AFTER max_days_to_maturity;
ALTER TABLE buyers ADD COLUMN current_exposure DECIMAL(15,2) DEFAULT 0.00 AFTER credit_limit;
ALTER TABLE buyers ADD COLUMN rate_card_id INT NULL AFTER current_exposure;

-- Add audit fields
ALTER TABLE buyers ADD COLUMN created_by INT NULL AFTER rate_card_id;
ALTER TABLE buyers ADD COLUMN approved_by INT NULL AFTER created_by;
ALTER TABLE buyers ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by;

-- Modify active_status to include 'draft' status
ALTER TABLE buyers MODIFY COLUMN active_status ENUM('draft', 'active', 'inactive', 'suspended') DEFAULT 'active';

-- ============================================================================
-- 2. ENHANCE USERS TABLE (First Login Flow)
-- ============================================================================

-- Add first-login password change requirement
ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0 AFTER active_status;

-- Add email verification tracking
ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) DEFAULT 0 AFTER must_change_password;

-- Add activation token for new user setup
ALTER TABLE users ADD COLUMN activation_token VARCHAR(255) NULL AFTER is_email_verified;
ALTER TABLE users ADD COLUMN activation_expires_at TIMESTAMP NULL AFTER activation_token;

-- ============================================================================
-- 3. CREATE RATE_CARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_cards (
    rate_card_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Base annual rate (percentage)
    base_annual_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    
    -- Risk tier adjustments (added to base rate)
    tier_a_adjustment DECIMAL(5,2) DEFAULT -2.00,  -- Premium tier gets lower rate
    tier_b_adjustment DECIMAL(5,2) DEFAULT 0.00,   -- Standard tier
    tier_c_adjustment DECIMAL(5,2) DEFAULT 3.00,   -- Higher risk tier
    
    -- Days to maturity brackets (JSON for flexibility)
    -- Example: [{"min": 0, "max": 30, "rate_adj": 0}, {"min": 31, "max": 60, "rate_adj": 0.5}]
    days_brackets JSON NULL,
    
    -- Flags
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    -- Audit
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_rate_cards_default (is_default),
    INDEX idx_rate_cards_active (is_active)
);

-- Insert default rate card
INSERT INTO rate_cards (name, description, base_annual_rate, is_default, is_active) 
VALUES ('Standard Rate Card', 'Default rate card for all buyers', 18.00, 1, 1);

-- ============================================================================
-- 4. CREATE BUYER_DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    
    -- Document classification
    document_type ENUM(
        'cipc_certificate',      -- Company registration
        'tax_clearance',         -- SARS tax clearance
        'financial_statements',  -- Annual financials
        'bank_confirmation',     -- Bank account confirmation
        'trade_references',      -- Trade reference letters
        'director_id',           -- Director ID copies
        'resolution',            -- Board resolution
        'other'
    ) NOT NULL,
    
    -- File details
    document_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NULL,
    blob_url VARCHAR(500) NOT NULL,
    file_size INT NULL,  -- in bytes
    mime_type VARCHAR(100) NULL,
    
    -- Verification status
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_by INT NULL,
    verified_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Expiry tracking (for certificates that expire)
    expires_at DATE NULL,
    
    -- Audit
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
    FOREIGN KEY (verified_by) REFERENCES users(user_id),
    
    INDEX idx_buyer_docs_buyer (buyer_id),
    INDEX idx_buyer_docs_type (document_type),
    INDEX idx_buyer_docs_status (verification_status)
);

-- ============================================================================
-- 5. ADD FOREIGN KEY FOR RATE_CARD_ID
-- ============================================================================

ALTER TABLE buyers 
ADD CONSTRAINT fk_buyers_rate_card 
FOREIGN KEY (rate_card_id) REFERENCES rate_cards(rate_card_id) ON DELETE SET NULL;

-- ============================================================================
-- 6. CREATE BUYER_CHANGE_LOG TABLE (for critical field changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_change_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    
    -- What changed
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    
    -- Change metadata
    change_reason TEXT NULL,
    requires_approval TINYINT(1) DEFAULT 0,
    
    -- Approval status (for critical changes)
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Audit
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    
    INDEX idx_buyer_changes_buyer (buyer_id),
    INDEX idx_buyer_changes_field (field_name),
    INDEX idx_buyer_changes_status (approval_status)
);

-- ============================================================================
-- 7. UPDATE EXISTING BUYERS WITH DEFAULT VALUES
-- ============================================================================

-- Set default rate card for existing buyers
UPDATE buyers 
SET rate_card_id = (SELECT rate_card_id FROM rate_cards WHERE is_default = 1 LIMIT 1)
WHERE rate_card_id IS NULL;

-- Set default eligibility values for existing buyers (already have defaults from ALTER)
-- No action needed - ALTER TABLE defaults apply

-- ============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_buyers_risk_tier ON buyers(risk_tier);
CREATE INDEX idx_buyers_industry ON buyers(industry_sector);
CREATE INDEX idx_buyers_status ON buyers(active_status);
CREATE INDEX idx_buyers_rate_card ON buyers(rate_card_id);
CREATE INDEX idx_users_activation ON users(activation_token);
CREATE INDEX idx_users_must_change ON users(must_change_password);

-- ============================================================================
-- ROLLBACK SCRIPT (Keep commented for reference)
-- ============================================================================
/*
-- Rollback buyers columns
ALTER TABLE buyers 
  DROP COLUMN trading_name,
  DROP COLUMN registration_no,
  DROP COLUMN tax_id,
  DROP COLUMN industry_sector,
  DROP COLUMN risk_tier,
  DROP COLUMN physical_address_street,
  DROP COLUMN physical_address_city,
  DROP COLUMN physical_address_province,
  DROP COLUMN physical_address_postal,
  DROP COLUMN primary_contact_name,
  DROP COLUMN financial_contact_name,
  DROP COLUMN financial_contact_email,
  DROP COLUMN min_invoice_amount,
  DROP COLUMN max_invoice_amount,
  DROP COLUMN min_days_to_maturity,
  DROP COLUMN max_days_to_maturity,
  DROP COLUMN credit_limit,
  DROP COLUMN current_exposure,
  DROP COLUMN rate_card_id,
  DROP COLUMN created_by,
  DROP COLUMN approved_by,
  DROP COLUMN approved_at;

ALTER TABLE buyers MODIFY COLUMN active_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active';

-- Rollback users columns
ALTER TABLE users 
  DROP COLUMN must_change_password,
  DROP COLUMN is_email_verified,
  DROP COLUMN activation_token,
  DROP COLUMN activation_expires_at;

-- Drop tables
DROP TABLE IF EXISTS buyer_change_log;
DROP TABLE IF EXISTS buyer_documents;
DROP TABLE IF EXISTS rate_cards;
*/
