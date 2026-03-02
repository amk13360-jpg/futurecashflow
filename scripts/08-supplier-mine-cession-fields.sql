-- ============================================================================
-- Migration 08: Add Mine Cession Approval + Bank Change Effective Date
-- Run AFTER: 07-add-payment-capture-type-value.sql
-- Compatible with MySQL < 8.0.29 (no IF NOT EXISTS on ADD COLUMN)
-- ============================================================================

-- Add mine cession tracking fields to suppliers table
-- Run each statement separately if any column already exists
ALTER TABLE suppliers
  ADD COLUMN bank_change_effective_date  DATE     NULL,
  ADD COLUMN mine_cession_approved       BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN mine_approval_date          DATE     NULL;

-- Audit log entry
INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
VALUES ('migration_08_applied', NOW(), 'Mine cession approval fields added to suppliers');
