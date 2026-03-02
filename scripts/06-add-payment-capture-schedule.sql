-- Migration: 06-add-payment-capture-schedule.sql
-- Description: Add payment_capture_schedule column to buyers table

-- Up
ALTER TABLE buyers
  ADD COLUMN payment_capture_schedule ENUM('immediate','daily','weekly','monthly') DEFAULT 'daily' AFTER rate_card_id;

-- Down (rollback)
-- To rollback this migration run the following statement:
-- ALTER TABLE buyers DROP COLUMN payment_capture_schedule;
