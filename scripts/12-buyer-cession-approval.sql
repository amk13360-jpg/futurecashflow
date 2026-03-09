-- Migration 12: Buyer Cession Agreement Approval
-- Adds buyer-side approval columns and extends the status ENUM
-- Run this migration once against the live database.
-- Compatible with MySQL 5.7+ (no IF NOT EXISTS on ADD COLUMN)

-- 1. Extend the status ENUM to include 'buyer_approved'
ALTER TABLE cession_agreements
  MODIFY COLUMN status
    ENUM('pending','signed','buyer_approved','approved','rejected')
    DEFAULT 'pending';

-- 2 & 3. Add columns + FK via stored procedure (safe re-run on any MySQL 5.7+)
DROP PROCEDURE IF EXISTS _migration12;

DELIMITER $$
CREATE PROCEDURE _migration12()
BEGIN
  -- buyer_approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'cession_agreements'
      AND COLUMN_NAME  = 'buyer_approved_by'
  ) THEN
    ALTER TABLE cession_agreements
      ADD COLUMN buyer_approved_by INT NULL AFTER approved_at;
  END IF;

  -- buyer_approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'cession_agreements'
      AND COLUMN_NAME  = 'buyer_approved_at'
  ) THEN
    ALTER TABLE cession_agreements
      ADD COLUMN buyer_approved_at TIMESTAMP NULL AFTER buyer_approved_by;
  END IF;

  -- FK fk_cession_buyer_approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA     = DATABASE()
      AND TABLE_NAME       = 'cession_agreements'
      AND CONSTRAINT_NAME  = 'fk_cession_buyer_approved_by'
      AND CONSTRAINT_TYPE  = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE cession_agreements
      ADD CONSTRAINT fk_cession_buyer_approved_by
        FOREIGN KEY (buyer_approved_by) REFERENCES users (user_id) ON DELETE SET NULL;
  END IF;

  -- Index idx_cession_status_buyer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'cession_agreements'
      AND INDEX_NAME   = 'idx_cession_status_buyer'
  ) THEN
    ALTER TABLE cession_agreements
      ADD INDEX idx_cession_status_buyer (buyer_id, status);
  END IF;
END$$
DELIMITER ;

CALL _migration12();
DROP PROCEDURE IF EXISTS _migration12;
