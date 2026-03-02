-- ============================================================================
-- Migration 08: Add Mine Cession Approval + Bank Change Effective Date
-- Run AFTER: 07-add-payment-capture-type-value.sql
-- MySQL 8.0.29+ required for IF NOT EXISTS on ADD COLUMN
-- ============================================================================

-- Add mine cession tracking fields to suppliers table
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS bank_change_effective_date  DATE     NULL,
  ADD COLUMN IF NOT EXISTS mine_cession_approved       BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mine_approval_date          DATE     NULL;

-- Audit log entry
INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
VALUES ('migration_08_applied', NOW(), 'Mine cession approval fields added to suppliers');
