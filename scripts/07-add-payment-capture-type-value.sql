-- Migration: 07-add-payment-capture-type-value.sql
-- Description: Add structured payment capture fields to buyers table.
--              payment_capture_type  — 'weekly' or 'monthly'
--              payment_capture_value — weekday name or day-of-month number
-- Backward compatible: NULL defaults leave existing buyers unaffected.
-- Run AFTER 06-add-payment-capture-schedule.sql

-- Up
ALTER TABLE buyers
  ADD COLUMN payment_capture_type  ENUM('weekly','monthly') NULL AFTER payment_capture_schedule,
  ADD COLUMN payment_capture_value VARCHAR(20)              NULL AFTER payment_capture_type;

-- Indexes for audit queries
ALTER TABLE buyer_change_log
  MODIFY COLUMN field_name VARCHAR(100) NOT NULL;

-- Down (rollback)
-- ALTER TABLE buyers
--   DROP COLUMN payment_capture_type,
--   DROP COLUMN payment_capture_value;
