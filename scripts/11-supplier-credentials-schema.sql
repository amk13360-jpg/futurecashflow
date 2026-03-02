-- ============================================================================
-- 11-supplier-credentials-schema.sql
-- Supplier Password Credentials
--
-- Adds password_hash to the suppliers table so suppliers can log in
-- with email + password after their first token-based access.
-- Credentials are generated automatically when the supplier signs
-- their cession agreement.
--
-- Run with: node scripts/run-migration-11.js
-- ============================================================================

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL
    COMMENT 'bcrypt password hash, set when supplier signs cession agreement',
  ADD COLUMN IF NOT EXISTS password_set_at DATETIME NULL
    COMMENT 'When credentials were first issued';
