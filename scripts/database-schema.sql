-- =====================================================
-- Database Schema Export: fmf_scf_platform
-- Azure MySQL: futurefinancecashflow.mysql.database.azure.com
-- Exported on: 2026-01-27T20:23:51.601Z
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- -----------------------------------------------------
-- Table: audit_logs
-- -----------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `user_type` enum('admin','accounts_payable','supplier','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=711 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: bank_change_requests
-- -----------------------------------------------------
DROP TABLE IF EXISTS `bank_change_requests`;
CREATE TABLE `bank_change_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `old_bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_bank_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_account_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_branch_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_account_type` enum('current','savings','business') COLLATE utf8mb4_unicode_ci DEFAULT 'business',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `supporting_document_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `bank_change_requests_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE,
  CONSTRAINT `bank_change_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: buyer_change_log
-- -----------------------------------------------------
DROP TABLE IF EXISTS `buyer_change_log`;
CREATE TABLE `buyer_change_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `change_reason` text COLLATE utf8mb4_unicode_ci,
  `requires_approval` tinyint(1) DEFAULT '0',
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'approved',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `changed_by` int NOT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_buyer_changes_buyer` (`buyer_id`),
  KEY `idx_buyer_changes_field` (`field_name`),
  KEY `idx_buyer_changes_status` (`approval_status`),
  CONSTRAINT `buyer_change_log_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: buyer_documents
-- -----------------------------------------------------
DROP TABLE IF EXISTS `buyer_documents`;
CREATE TABLE `buyer_documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `document_type` enum('cipc_certificate','tax_clearance','financial_statements','bank_confirmation','trade_references','director_id','resolution','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blob_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `expires_at` date DEFAULT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `idx_buyer_docs_buyer` (`buyer_id`),
  KEY `idx_buyer_docs_type` (`document_type`),
  KEY `idx_buyer_docs_status` (`verification_status`),
  CONSTRAINT `buyer_documents_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: buyers
-- -----------------------------------------------------
DROP TABLE IF EXISTS `buyers`;
CREATE TABLE `buyers` (
  `buyer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trading_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry_sector` enum('mining','manufacturing','retail','construction','agriculture','services','other') COLLATE utf8mb4_unicode_ci DEFAULT 'mining',
  `risk_tier` enum('A','B','C') COLLATE utf8mb4_unicode_ci DEFAULT 'B',
  `physical_address_street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `physical_address_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `physical_address_province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `physical_address_postal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_contact_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `financial_contact_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `financial_contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_invoice_amount` decimal(15,2) DEFAULT '1000.00',
  `max_invoice_amount` decimal(15,2) DEFAULT '5000000.00',
  `min_days_to_maturity` int DEFAULT '7',
  `max_days_to_maturity` int DEFAULT '90',
  `credit_limit` decimal(15,2) DEFAULT NULL,
  `current_exposure` decimal(15,2) DEFAULT '0.00',
  `rate_card_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `active_status` enum('draft','active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`buyer_id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active_status` (`active_status`),
  KEY `idx_buyers_risk_tier` (`risk_tier`),
  KEY `idx_buyers_industry` (`industry_sector`),
  KEY `idx_buyers_status` (`active_status`),
  KEY `idx_buyers_rate_card` (`rate_card_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: cession_agreements
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cession_agreements`;
CREATE TABLE `cession_agreements` (
  `cession_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `document_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_type` enum('uploaded','digitally_signed') COLLATE utf8mb4_unicode_ci DEFAULT 'uploaded',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '1.0',
  `signed_date` date DEFAULT NULL,
  `signature_data` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','signed','buyer_approved','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `buyer_approved_by` int DEFAULT NULL,
  `buyer_approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_standing` tinyint(1) DEFAULT '0',
  `standing_valid_until` date DEFAULT NULL,
  `parent_cession_id` int DEFAULT NULL,
  `trigger_reason` text COLLATE utf8mb4_unicode_ci,
  `buyer_id` int DEFAULT NULL,
  `linked_invoice_ids` json DEFAULT NULL,
  PRIMARY KEY (`cession_id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_status` (`status`),
  KEY `fk_parent_cession` (`parent_cession_id`),
  KEY `fk_cession_buyer` (`buyer_id`),
  KEY `buyer_approved_by` (`buyer_approved_by`),
  KEY `idx_cession_status_buyer` (`buyer_id`,`status`),
  CONSTRAINT `cession_agreements_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE,
  CONSTRAINT `cession_agreements_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cession_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cession_buyer_approved_by` FOREIGN KEY (`buyer_approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_parent_cession` FOREIGN KEY (`parent_cession_id`) REFERENCES `cession_agreements` (`cession_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: email_templates
-- -----------------------------------------------------
DROP TABLE IF EXISTS `email_templates`;
CREATE TABLE `email_templates` (
  `template_id` int NOT NULL AUTO_INCREMENT,
  `template_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_html` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_text` text COLLATE utf8mb4_unicode_ci,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `template_key` (`template_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: invoices
-- -----------------------------------------------------
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'ZAR',
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','matched','offered','accepted','paid','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `posting_date` date DEFAULT NULL,
  `baseline_date` date DEFAULT NULL,
  `net_due_date` date DEFAULT NULL,
  `days_overdue` int DEFAULT NULL,
  `amount_doc_curr` decimal(15,2) DEFAULT NULL,
  `amount_local_curr` decimal(15,2) DEFAULT NULL,
  `payment_terms` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignment_po` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_invoice` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `open_item` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text_description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `unique_invoice` (`buyer_id`,`invoice_number`),
  KEY `supplier_id` (`supplier_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_vendor_number` (`vendor_number`),
  KEY `idx_document_number` (`document_number`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: notification_rules
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notification_rules`;
CREATE TABLE `notification_rules` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger_event` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_type` enum('admin','ap_user','supplier','buyer_contact') COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','sms','in_app') COLLATE utf8mb4_unicode_ci DEFAULT 'email',
  `template_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `conditions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`),
  KEY `idx_trigger_event` (`trigger_event`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: notifications
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('supplier','user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` int NOT NULL,
  `notification_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','sms','in_app') COLLATE utf8mb4_unicode_ci DEFAULT 'email',
  `status` enum('pending','sent','failed','read') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_recipient` (`recipient_type`,`recipient_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: offer_batches
-- -----------------------------------------------------
DROP TABLE IF EXISTS `offer_batches`;
CREATE TABLE `offer_batches` (
  `batch_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `total_invoice_amount` decimal(15,2) DEFAULT NULL,
  `total_discount_amount` decimal(15,2) DEFAULT NULL,
  `total_net_payment` decimal(15,2) DEFAULT NULL,
  `invoice_count` int DEFAULT '0',
  `status` enum('draft','pending_review','sent','partial_accepted','accepted','expired','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `send_mode` enum('auto','review','scheduled') COLLATE utf8mb4_unicode_ci DEFAULT 'review',
  `scheduled_send_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`batch_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_buyer_id` (`buyer_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `offer_batches_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE,
  CONSTRAINT `offer_batches_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE CASCADE,
  CONSTRAINT `offer_batches_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: offers
-- -----------------------------------------------------
DROP TABLE IF EXISTS `offers`;
CREATE TABLE `offers` (
  `offer_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `annual_rate` decimal(5,2) NOT NULL,
  `days_to_maturity` int NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL,
  `net_payment_amount` decimal(15,2) NOT NULL,
  `offer_expiry_date` timestamp NOT NULL,
  `status` enum('sent','opened','accepted','rejected','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'sent',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `opened_at` timestamp NULL DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `batch_id` int DEFAULT NULL,
  PRIMARY KEY (`offer_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_offer_expiry_date` (`offer_expiry_date`),
  KEY `fk_offers_batch` (`batch_id`),
  CONSTRAINT `fk_offers_batch` FOREIGN KEY (`batch_id`) REFERENCES `offer_batches` (`batch_id`) ON DELETE SET NULL,
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE,
  CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE,
  CONSTRAINT `offers_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: otp_codes
-- -----------------------------------------------------
DROP TABLE IF EXISTS `otp_codes`;
CREATE TABLE `otp_codes` (
  `otp_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otp_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `otp_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: payments
-- -----------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `offer_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'ZAR',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('eft','bank_transfer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'eft',
  `status` enum('queued','processing','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'queued',
  `scheduled_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `batch_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `payment_reference` (`payment_reference`),
  KEY `offer_id` (`offer_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_status` (`status`),
  KEY `idx_batch_id` (`batch_id`),
  KEY `idx_scheduled_date` (`scheduled_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`offer_id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: rate_cards
-- -----------------------------------------------------
DROP TABLE IF EXISTS `rate_cards`;
CREATE TABLE `rate_cards` (
  `rate_card_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `base_annual_rate` decimal(5,2) NOT NULL DEFAULT '18.00',
  `tier_a_adjustment` decimal(5,2) DEFAULT '-2.00',
  `tier_b_adjustment` decimal(5,2) DEFAULT '0.00',
  `tier_c_adjustment` decimal(5,2) DEFAULT '3.00',
  `days_brackets` json DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rate_card_id`),
  KEY `idx_rate_cards_default` (`is_default`),
  KEY `idx_rate_cards_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: repayments
-- -----------------------------------------------------
DROP TABLE IF EXISTS `repayments`;
CREATE TABLE `repayments` (
  `repayment_id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `expected_amount` decimal(15,2) NOT NULL,
  `received_amount` decimal(15,2) DEFAULT '0.00',
  `due_date` date NOT NULL,
  `received_date` date DEFAULT NULL,
  `status` enum('pending','partial','completed','overdue') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reconciliation_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`repayment_id`),
  KEY `payment_id` (`payment_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `repayments_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE,
  CONSTRAINT `repayments_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: supplier_tokens
-- -----------------------------------------------------
DROP TABLE IF EXISTS `supplier_tokens`;
CREATE TABLE `supplier_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_type` enum('invite','reset_password','offer_access','approval') COLLATE utf8mb4_unicode_ci DEFAULT 'invite',
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `short_code` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `supplier_id` (`supplier_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_short_code` (`short_code`),
  CONSTRAINT `supplier_tokens_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: suppliers
-- -----------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vat_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `physical_address` text COLLATE utf8mb4_unicode_ci,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_type` enum('current','savings','business') COLLATE utf8mb4_unicode_ci DEFAULT 'business',
  `risk_tier` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `onboarding_status` enum('pending','documents_submitted','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `active_status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `vendor_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `bank_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT 'ZA',
  `bank_key_branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iban` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `swift_bic` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_payment_terms` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reconciliation_gl_account` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `vat_no` (`vat_no`),
  UNIQUE KEY `vendor_number` (`vendor_number`),
  KEY `idx_vat_no` (`vat_no`),
  KEY `idx_onboarding_status` (`onboarding_status`),
  KEY `idx_active_status` (`active_status`),
  KEY `idx_vendor_number` (`vendor_number`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: system_settings
-- -----------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: trusted_devices
-- -----------------------------------------------------
DROP TABLE IF EXISTS `trusted_devices`;
CREATE TABLE `trusted_devices` (
  `device_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `trusted_until` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`device_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_fingerprint` (`device_fingerprint`),
  KEY `idx_trusted_until` (`trusted_until`),
  CONSTRAINT `trusted_devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: users
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','accounts_payable','auditor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `buyer_id` int DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active_status` enum('active','inactive','locked') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `must_change_password` tinyint(1) DEFAULT '0',
  `is_email_verified` tinyint(1) DEFAULT '0',
  `activation_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activation_expires_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `buyer_id` (`buyer_id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_users_activation` (`activation_token`),
  KEY `idx_users_must_change` (`must_change_password`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`buyer_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = 1;
