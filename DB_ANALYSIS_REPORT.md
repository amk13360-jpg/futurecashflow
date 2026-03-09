# DB Analysis Report — fmf_scf_platform
**Generated:** 2026-03-09 14:28:53 UTC  
**Host:** futurefinancecashflow.mysql.database.azure.com  
**Database:** fmf_scf_platform

---

# 1. Tables Overview

| Table | Approx Rows | Auto-Inc |
|-------|------------|---------|
| `audit_logs` | 1082 | 1105 |
| `bank_change_requests` | 0 | 1 |
| `buyer_change_log` | 1 | 2 |
| `buyer_documents` | 0 | 1 |
| `buyers` | 6 | 27 |
| `cession_agreements` | 12 | 40 |
| `email_templates` | 0 | 1 |
| `invoices` | 17 | 175 |
| `notification_rules` | 8 | 9 |
| `notifications` | 0 | 1 |
| `offer_batches` | 7 | 61 |
| `offers` | 8 | 43 |
| `otp_codes` | 43 | 126 |
| `payments` | 3 | 14 |
| `rate_cards` | 1 | 2 |
| `repayments` | 0 | 1 |
| `supplier_tokens` | 34 | 225 |
| `suppliers` | 11 | 138 |
| `system_settings` | 22 | 24 |
| `trusted_devices` | 0 | 1 |
| `users` | 7 | 24 |

## Missing Expected Tables
- ✅ All expected tables exist in the database

# 2. Column-Level Schema (all tables)

## `audit_logs`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `log_id` | int | NO | NULL | auto_increment |
| `user_id` | int | YES | NULL |  |
| `user_type` | enum('admin','accounts_payable','supplier','system') | NO | NULL |  |
| `action` | varchar(255) | NO | NULL |  |
| `entity_type` | varchar(100) | YES | NULL |  |
| `entity_id` | int | YES | NULL |  |
| `details` | text | YES | NULL |  |
| `ip_address` | varchar(45) | YES | NULL |  |
| `user_agent` | text | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## `bank_change_requests`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `request_id` | int | NO | NULL | auto_increment |
| `supplier_id` | int | NO | NULL |  |
| `old_bank_name` | varchar(100) | YES | NULL |  |
| `old_account_no` | varchar(50) | YES | NULL |  |
| `new_bank_name` | varchar(100) | NO | NULL |  |
| `new_account_no` | varchar(50) | NO | NULL |  |
| `new_branch_code` | varchar(20) | NO | NULL |  |
| `new_account_type` | enum('current','savings','business') | YES | business |  |
| `reason` | text | YES | NULL |  |
| `supporting_document_url` | varchar(500) | YES | NULL |  |
| `status` | enum('pending','approved','rejected') | YES | pending |  |
| `reviewed_by` | int | YES | NULL |  |
| `reviewed_at` | timestamp | YES | NULL |  |
| `review_notes` | text | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `effective_date` | date | YES | NULL |  |

## `buyer_change_log`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `log_id` | int | NO | NULL | auto_increment |
| `buyer_id` | int | NO | NULL |  |
| `field_name` | varchar(100) | NO | NULL |  |
| `old_value` | text | YES | NULL |  |
| `new_value` | text | YES | NULL |  |
| `change_reason` | text | YES | NULL |  |
| `requires_approval` | tinyint(1) | YES | 0 |  |
| `approval_status` | enum('pending','approved','rejected') | YES | approved |  |
| `approved_by` | int | YES | NULL |  |
| `approved_at` | timestamp | YES | NULL |  |
| `changed_by` | int | NO | NULL |  |
| `changed_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## `buyer_documents`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `document_id` | int | NO | NULL | auto_increment |
| `buyer_id` | int | NO | NULL |  |
| `document_type` | enum('cipc_certificate','tax_clearance','financial_statements','bank_confirmation','trade_references','director_id','resolution','mine_permit','environmental_clearance','royalty_agreement','supply_agreement','other') | NO | NULL |  |
| `file_name` | varchar(255) | NO | NULL |  |
| `original_filename` | varchar(255) | YES | NULL |  |
| `file_url` | varchar(500) | NO | NULL |  |
| `file_size` | int | YES | NULL |  |
| `mime_type` | varchar(100) | YES | NULL |  |
| `verification_status` | enum('pending','verified','rejected') | YES | pending |  |
| `verified_by` | int | YES | NULL |  |
| `verified_at` | timestamp | YES | NULL |  |
| `rejection_reason` | text | YES | NULL |  |
| `expires_at` | date | YES | NULL |  |
| `uploaded_by` | int | NO | NULL |  |
| `uploaded_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## `buyers`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `buyer_id` | int | NO | NULL | auto_increment |
| `name` | varchar(255) | NO | NULL |  |
| `trading_name` | varchar(255) | YES | NULL |  |
| `registration_no` | varchar(100) | YES | NULL |  |
| `tax_id` | varchar(50) | YES | NULL |  |
| `industry_sector` | enum('mining','manufacturing','retail','construction','agriculture','services','other') | YES | mining |  |
| `risk_tier` | enum('A','B','C') | YES | B |  |
| `physical_address_street` | varchar(255) | YES | NULL |  |
| `physical_address_city` | varchar(100) | YES | NULL |  |
| `physical_address_province` | varchar(100) | YES | NULL |  |
| `physical_address_postal` | varchar(20) | YES | NULL |  |
| `primary_contact_name` | varchar(255) | YES | NULL |  |
| `code` | varchar(50) | NO | NULL |  |
| `contact_email` | varchar(255) | NO | NULL |  |
| `contact_phone` | varchar(50) | YES | NULL |  |
| `financial_contact_name` | varchar(255) | YES | NULL |  |
| `financial_contact_email` | varchar(255) | YES | NULL |  |
| `min_invoice_amount` | decimal(15,2) | YES | 1000.00 |  |
| `max_invoice_amount` | decimal(15,2) | YES | 5000000.00 |  |
| `min_days_to_maturity` | int | YES | 7 |  |
| `max_days_to_maturity` | int | YES | 90 |  |
| `credit_limit` | decimal(15,2) | YES | NULL |  |
| `current_exposure` | decimal(15,2) | YES | 0.00 |  |
| `rate_card_id` | int | YES | NULL |  |
| `payment_capture_schedule` | enum('immediate','daily','weekly','monthly') | YES | daily |  |
| `payment_capture_type` | enum('weekly','monthly') | YES | NULL |  |
| `payment_capture_value` | varchar(20) | YES | NULL |  |
| `created_by` | int | YES | NULL |  |
| `approved_by` | int | YES | NULL |  |
| `approved_at` | timestamp | YES | NULL |  |
| `active_status` | enum('draft','active','inactive','suspended') | YES | active |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `require_cession_approval` | tinyint(1) | NO | 0 |  |

## `cession_agreements`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `cession_id` | int | NO | NULL | auto_increment |
| `supplier_id` | int | NO | NULL |  |
| `document_url` | varchar(500) | YES | NULL |  |
| `document_type` | enum('uploaded','digitally_signed') | YES | uploaded |  |
| `version` | varchar(20) | YES | 1.0 |  |
| `signed_date` | date | YES | NULL |  |
| `signature_data` | text | YES | NULL |  |
| `status` | enum('pending','signed','buyer_approved','approved','rejected') | YES | pending |  |
| `approved_by` | int | YES | NULL |  |
| `approved_at` | timestamp | YES | NULL |  |
| `buyer_approved_by` | int | YES | NULL |  |
| `buyer_approved_at` | timestamp | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `is_standing` | tinyint(1) | YES | 0 |  |
| `standing_valid_until` | date | YES | NULL |  |
| `parent_cession_id` | int | YES | NULL |  |
| `trigger_reason` | text | YES | NULL |  |
| `buyer_id` | int | YES | NULL |  |
| `linked_invoice_ids` | json | YES | NULL |  |

## `email_templates`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `template_id` | int | NO | NULL | auto_increment |
| `template_key` | varchar(100) | NO | NULL |  |
| `template_name` | varchar(255) | NO | NULL |  |
| `subject` | varchar(500) | NO | NULL |  |
| `body_html` | text | NO | NULL |  |
| `body_text` | text | YES | NULL |  |
| `variables` | json | YES | NULL |  |
| `is_active` | tinyint(1) | YES | 1 |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `invoices`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `invoice_id` | int | NO | NULL | auto_increment |
| `buyer_id` | int | NO | NULL |  |
| `supplier_id` | int | NO | NULL |  |
| `invoice_number` | varchar(100) | NO | NULL |  |
| `invoice_date` | date | NO | NULL |  |
| `due_date` | date | NO | NULL |  |
| `amount` | decimal(15,2) | NO | NULL |  |
| `currency` | varchar(3) | YES | ZAR |  |
| `description` | text | YES | NULL |  |
| `status` | enum('pending','matched','offered','accepted','paid','rejected') | YES | pending |  |
| `uploaded_by` | int | YES | NULL |  |
| `uploaded_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `company_code` | varchar(20) | YES | NULL |  |
| `vendor_number` | varchar(50) | YES | NULL |  |
| `document_number` | varchar(100) | YES | NULL |  |
| `document_type` | varchar(10) | YES | NULL |  |
| `document_date` | date | YES | NULL |  |
| `posting_date` | date | YES | NULL |  |
| `baseline_date` | date | YES | NULL |  |
| `net_due_date` | date | YES | NULL |  |
| `days_overdue` | int | YES | NULL |  |
| `amount_doc_curr` | decimal(15,2) | YES | NULL |  |
| `amount_local_curr` | decimal(15,2) | YES | NULL |  |
| `payment_terms` | varchar(100) | YES | NULL |  |
| `payment_method` | varchar(50) | YES | NULL |  |
| `assignment_po` | varchar(100) | YES | NULL |  |
| `reference_invoice` | varchar(100) | YES | NULL |  |
| `open_item` | varchar(10) | YES | NULL |  |
| `text_description` | text | YES | NULL |  |

## `notification_rules`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `rule_id` | int | NO | NULL | auto_increment |
| `rule_name` | varchar(255) | NO | NULL |  |
| `trigger_event` | varchar(100) | NO | NULL |  |
| `recipient_type` | enum('admin','ap_user','supplier','buyer_contact') | NO | NULL |  |
| `channel` | enum('email','sms','in_app') | YES | email |  |
| `template_key` | varchar(100) | NO | NULL |  |
| `is_active` | tinyint(1) | YES | 1 |  |
| `conditions` | json | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `notifications`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `notification_id` | int | NO | NULL | auto_increment |
| `recipient_type` | enum('supplier','user') | NO | NULL |  |
| `recipient_id` | int | NO | NULL |  |
| `notification_type` | varchar(100) | NO | NULL |  |
| `subject` | varchar(255) | YES | NULL |  |
| `message` | text | NO | NULL |  |
| `channel` | enum('email','sms','in_app') | YES | email |  |
| `status` | enum('pending','sent','failed','read') | YES | pending |  |
| `sent_at` | timestamp | YES | NULL |  |
| `read_at` | timestamp | YES | NULL |  |
| `metadata` | json | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## `offer_batches`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `batch_id` | int | NO | NULL | auto_increment |
| `supplier_id` | int | NO | NULL |  |
| `buyer_id` | int | NO | NULL |  |
| `total_invoice_amount` | decimal(15,2) | YES | NULL |  |
| `total_discount_amount` | decimal(15,2) | YES | NULL |  |
| `total_net_payment` | decimal(15,2) | YES | NULL |  |
| `invoice_count` | int | YES | 0 |  |
| `status` | enum('draft','pending_review','sent','partial_accepted','accepted','expired','cancelled') | YES | draft |  |
| `send_mode` | enum('auto','review','scheduled') | YES | review |  |
| `scheduled_send_at` | timestamp | YES | NULL |  |
| `sent_at` | timestamp | YES | NULL |  |
| `expires_at` | timestamp | YES | NULL |  |
| `created_by` | int | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `offers`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `offer_id` | int | NO | NULL | auto_increment |
| `invoice_id` | int | NO | NULL |  |
| `supplier_id` | int | NO | NULL |  |
| `buyer_id` | int | NO | NULL |  |
| `annual_rate` | decimal(5,2) | NO | NULL |  |
| `days_to_maturity` | int | NO | NULL |  |
| `discount_amount` | decimal(15,2) | NO | NULL |  |
| `net_payment_amount` | decimal(15,2) | NO | NULL |  |
| `offer_expiry_date` | timestamp | NO | NULL |  |
| `status` | enum('draft','sent','opened','accepted','rejected','expired') | YES | draft |  |
| `sent_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `opened_at` | timestamp | YES | NULL |  |
| `responded_at` | timestamp | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `batch_id` | int | YES | NULL |  |

## `otp_codes`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `otp_id` | int | NO | NULL | auto_increment |
| `user_id` | int | NO | NULL |  |
| `code` | varchar(6) | NO | NULL |  |
| `expires_at` | timestamp | NO | NULL |  |
| `used_at` | timestamp | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## `payments`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `payment_id` | int | NO | NULL | auto_increment |
| `offer_id` | int | NO | NULL |  |
| `supplier_id` | int | NO | NULL |  |
| `amount` | decimal(15,2) | NO | NULL |  |
| `currency` | varchar(3) | YES | ZAR |  |
| `payment_reference` | varchar(100) | YES | NULL |  |
| `payment_method` | enum('eft','bank_transfer','other') | YES | eft |  |
| `status` | enum('queued','processing','completed','failed','cancelled') | YES | queued |  |
| `scheduled_date` | date | YES | NULL |  |
| `completed_date` | date | YES | NULL |  |
| `batch_id` | varchar(100) | YES | NULL |  |
| `processed_by` | int | YES | NULL |  |
| `notes` | text | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `rate_cards`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `rate_card_id` | int | NO | NULL | auto_increment |
| `name` | varchar(100) | NO | NULL |  |
| `description` | text | YES | NULL |  |
| `base_annual_rate` | decimal(5,2) | NO | 18.00 |  |
| `tier_a_adjustment` | decimal(5,2) | YES | -2.00 |  |
| `tier_b_adjustment` | decimal(5,2) | YES | 0.00 |  |
| `tier_c_adjustment` | decimal(5,2) | YES | 3.00 |  |
| `days_brackets` | json | YES | NULL |  |
| `is_default` | tinyint(1) | YES | 0 |  |
| `is_active` | tinyint(1) | YES | 1 |  |
| `created_by` | int | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `repayments`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `repayment_id` | int | NO | NULL | auto_increment |
| `payment_id` | int | NO | NULL |  |
| `buyer_id` | int | NO | NULL |  |
| `expected_amount` | decimal(15,2) | NO | NULL |  |
| `received_amount` | decimal(15,2) | YES | 0.00 |  |
| `due_date` | date | NO | NULL |  |
| `received_date` | date | YES | NULL |  |
| `status` | enum('pending','partial','completed','overdue') | YES | pending |  |
| `reconciliation_reference` | varchar(100) | YES | NULL |  |
| `notes` | text | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `supplier_tokens`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `token_id` | int | NO | NULL | auto_increment |
| `supplier_id` | int | NO | NULL |  |
| `token` | varchar(255) | NO | NULL |  |
| `token_type` | enum('invite','reset_password','offer_access','approval') | YES | invite |  |
| `expires_at` | timestamp | NO | NULL |  |
| `used_at` | timestamp | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `short_code` | varchar(8) | YES | NULL |  |

## `suppliers`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `supplier_id` | int | NO | NULL | auto_increment |
| `name` | varchar(255) | NO | NULL |  |
| `vat_no` | varchar(50) | YES | NULL |  |
| `registration_no` | varchar(100) | YES | NULL |  |
| `contact_person` | varchar(255) | YES | NULL |  |
| `contact_email` | varchar(255) | NO | NULL |  |
| `contact_phone` | varchar(50) | YES | NULL |  |
| `physical_address` | text | YES | NULL |  |
| `bank_name` | varchar(100) | YES | NULL |  |
| `bank_account_no` | varchar(50) | YES | NULL |  |
| `bank_branch_code` | varchar(20) | YES | NULL |  |
| `bank_account_type` | enum('current','savings','business') | YES | business |  |
| `risk_tier` | enum('low','medium','high') | YES | medium |  |
| `onboarding_status` | enum('pending','documents_submitted','approved','rejected') | YES | pending |  |
| `approved_by` | int | YES | NULL |  |
| `approved_at` | timestamp | YES | NULL |  |
| `active_status` | enum('active','inactive','suspended') | YES | active |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `vendor_number` | varchar(50) | YES | NULL |  |
| `company_code` | varchar(20) | YES | NULL |  |
| `address` | text | YES | NULL |  |
| `bank_country` | varchar(2) | YES | ZA |  |
| `bank_key_branch_code` | varchar(20) | YES | NULL |  |
| `iban` | varchar(50) | YES | NULL |  |
| `swift_bic` | varchar(20) | YES | NULL |  |
| `default_payment_method` | varchar(50) | YES | NULL |  |
| `default_payment_terms` | varchar(100) | YES | NULL |  |
| `reconciliation_gl_account` | varchar(50) | YES | NULL |  |
| `bank_change_effective_date` | date | YES | NULL |  |
| `mine_cession_approved` | tinyint(1) | NO | 0 |  |
| `mine_approval_date` | date | YES | NULL |  |
| `password_hash` | varchar(255) | YES | NULL |  |
| `password_set_at` | datetime | YES | NULL |  |

## `system_settings`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `setting_id` | int | NO | NULL | auto_increment |
| `setting_key` | varchar(100) | NO | NULL |  |
| `setting_value` | text | YES | NULL |  |
| `setting_type` | enum('string','number','boolean','json') | YES | string |  |
| `description` | text | YES | NULL |  |
| `updated_by` | int | YES | NULL |  |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## `trusted_devices`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `device_id` | int | NO | NULL | auto_increment |
| `user_id` | int | NO | NULL |  |
| `device_fingerprint` | varchar(255) | NO | NULL |  |
| `device_name` | varchar(255) | YES | NULL |  |
| `ip_address` | varchar(45) | YES | NULL |  |
| `user_agent` | text | YES | NULL |  |
| `trusted_until` | timestamp | NO | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `last_used_at` | timestamp | YES | NULL |  |

## `users`

| Column | Type | Nullable | Default | Extra |
|--------|------|----------|---------|-------|
| `user_id` | int | NO | NULL | auto_increment |
| `username` | varchar(100) | NO | NULL |  |
| `email` | varchar(255) | NO | NULL |  |
| `password_hash` | varchar(255) | NO | NULL |  |
| `role` | enum('admin','accounts_payable','auditor') | NO | NULL |  |
| `buyer_id` | int | YES | NULL |  |
| `full_name` | varchar(255) | YES | NULL |  |
| `phone` | varchar(50) | YES | NULL |  |
| `active_status` | enum('active','inactive','locked') | YES | active |  |
| `must_change_password` | tinyint(1) | YES | 0 |  |
| `is_email_verified` | tinyint(1) | YES | 0 |  |
| `activation_token` | varchar(255) | YES | NULL |  |
| `activation_expires_at` | timestamp | YES | NULL |  |
| `failed_login_attempts` | int | YES | 0 |  |
| `last_login_at` | timestamp | YES | NULL |  |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

# 3. Backend vs DB Column Alignment
Cross-checking every column referenced in `lib/actions/**` against live DB.


## `cession_agreements`
- ✅ cession_id  [int]  nullable=NO
- ✅ supplier_id  [int]  nullable=NO
- ✅ buyer_id  [int]  nullable=YES
- ✅ document_url  [varchar(500)]  nullable=YES
- ✅ document_type  [enum('uploaded','digitally_signed')]  nullable=YES
- ✅ version  [varchar(20)]  nullable=YES
- ✅ signed_date  [date]  nullable=YES
- ✅ status  [enum('pending','signed','buyer_approved','approved','rejected')]  nullable=YES
- ✅ approved_by  [int]  nullable=YES
- ✅ approved_at  [timestamp]  nullable=YES
- ✅ buyer_approved_by  [int]  nullable=YES
- ✅ buyer_approved_at  [timestamp]  nullable=YES
- ✅ is_standing  [tinyint(1)]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `signature_data`, `standing_valid_until`, `parent_cession_id`, `trigger_reason`, `linked_invoice_ids`

## `suppliers`
- ✅ supplier_id  [int]  nullable=NO
- ✅ name  [varchar(255)]  nullable=NO
- ✅ vat_no  [varchar(50)]  nullable=YES
- ✅ registration_no  [varchar(100)]  nullable=YES
- ✅ contact_person  [varchar(255)]  nullable=YES
- ✅ contact_email  [varchar(255)]  nullable=NO
- ✅ contact_phone  [varchar(50)]  nullable=YES
- ✅ physical_address  [text]  nullable=YES
- ✅ address  [text]  nullable=YES
- ✅ bank_name  [varchar(100)]  nullable=YES
- ✅ bank_account_no  [varchar(50)]  nullable=YES
- ✅ bank_branch_code  [varchar(20)]  nullable=YES
- ✅ bank_account_type  [enum('current','savings','business')]  nullable=YES
- ✅ risk_tier  [enum('low','medium','high')]  nullable=YES
- ✅ onboarding_status  [enum('pending','documents_submitted','approved','rejected')]  nullable=YES
- ✅ active_status  [enum('active','inactive','suspended')]  nullable=YES
- ✅ company_code  [varchar(20)]  nullable=YES
- ✅ vendor_number  [varchar(50)]  nullable=YES
- ✅ password_hash  [varchar(255)]  nullable=YES
- ✅ password_set_at  [datetime]  nullable=YES
- ✅ mine_cession_approved  [tinyint(1)]  nullable=NO
- ✅ mine_approval_date  [date]  nullable=YES
- ✅ bank_change_effective_date  [date]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `approved_by`, `approved_at`, `bank_country`, `bank_key_branch_code`, `iban`, `swift_bic`, `default_payment_method`, `default_payment_terms`, `reconciliation_gl_account`

## `buyers`
- ✅ buyer_id  [int]  nullable=NO
- ✅ name  [varchar(255)]  nullable=NO
- ✅ trading_name  [varchar(255)]  nullable=YES
- ✅ code  [varchar(50)]  nullable=NO
- ✅ registration_no  [varchar(100)]  nullable=YES
- ✅ tax_id  [varchar(50)]  nullable=YES
- ✅ industry_sector  [enum('mining','manufacturing','retail','construction','agriculture','services','other')]  nullable=YES
- ✅ risk_tier  [enum('A','B','C')]  nullable=YES
- ✅ physical_address_street  [varchar(255)]  nullable=YES
- ✅ physical_address_city  [varchar(100)]  nullable=YES
- ✅ physical_address_province  [varchar(100)]  nullable=YES
- ✅ physical_address_postal  [varchar(20)]  nullable=YES
- ✅ primary_contact_name  [varchar(255)]  nullable=YES
- ✅ contact_email  [varchar(255)]  nullable=NO
- ✅ contact_phone  [varchar(50)]  nullable=YES
- ✅ financial_contact_name  [varchar(255)]  nullable=YES
- ✅ financial_contact_email  [varchar(255)]  nullable=YES
- ✅ min_invoice_amount  [decimal(15,2)]  nullable=YES
- ✅ max_invoice_amount  [decimal(15,2)]  nullable=YES
- ✅ min_days_to_maturity  [int]  nullable=YES
- ✅ max_days_to_maturity  [int]  nullable=YES
- ✅ credit_limit  [decimal(15,2)]  nullable=YES
- ✅ rate_card_id  [int]  nullable=YES
- ✅ payment_capture_schedule  [enum('immediate','daily','weekly','monthly')]  nullable=YES
- ✅ payment_capture_type  [enum('weekly','monthly')]  nullable=YES
- ✅ payment_capture_value  [varchar(20)]  nullable=YES
- ✅ require_cession_approval  [tinyint(1)]  nullable=NO
- ✅ created_by  [int]  nullable=YES
- ✅ active_status  [enum('draft','active','inactive','suspended')]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `current_exposure`, `approved_by`, `approved_at`

## `users`
- ✅ user_id  [int]  nullable=NO
- ✅ username  [varchar(100)]  nullable=NO
- ✅ email  [varchar(255)]  nullable=NO
- ✅ password_hash  [varchar(255)]  nullable=NO
- ✅ role  [enum('admin','accounts_payable','auditor')]  nullable=NO
- ✅ buyer_id  [int]  nullable=YES
- ✅ full_name  [varchar(255)]  nullable=YES
- ✅ active_status  [enum('active','inactive','locked')]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ✅ last_login_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `phone`, `must_change_password`, `is_email_verified`, `activation_token`, `activation_expires_at`, `failed_login_attempts`

## `invoices`
- ✅ invoice_id  [int]  nullable=NO
- ✅ buyer_id  [int]  nullable=NO
- ✅ supplier_id  [int]  nullable=NO
- ✅ invoice_number  [varchar(100)]  nullable=NO
- ✅ invoice_date  [date]  nullable=NO
- ✅ due_date  [date]  nullable=NO
- ✅ amount  [decimal(15,2)]  nullable=NO
- ✅ currency  [varchar(3)]  nullable=YES
- ✅ description  [text]  nullable=YES
- ✅ status  [enum('pending','matched','offered','accepted','paid','rejected')]  nullable=YES
- ✅ uploaded_by  [int]  nullable=YES
- ✅ uploaded_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ✅ company_code  [varchar(20)]  nullable=YES
- ✅ vendor_number  [varchar(50)]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `document_number`, `document_type`, `document_date`, `posting_date`, `baseline_date`, `net_due_date`, `days_overdue`, `amount_doc_curr`, `amount_local_curr`, `payment_terms`, `payment_method`, `assignment_po`, `reference_invoice`, `open_item`, `text_description`

## `offers`
- ✅ offer_id  [int]  nullable=NO
- ✅ invoice_id  [int]  nullable=NO
- ✅ supplier_id  [int]  nullable=NO
- ✅ buyer_id  [int]  nullable=NO
- ✅ batch_id  [int]  nullable=YES
- ✅ annual_rate  [decimal(5,2)]  nullable=NO
- ✅ days_to_maturity  [int]  nullable=NO
- ✅ discount_amount  [decimal(15,2)]  nullable=NO
- ✅ net_payment_amount  [decimal(15,2)]  nullable=NO
- ✅ offer_expiry_date  [timestamp]  nullable=NO
- ✅ status  [enum('draft','sent','opened','accepted','rejected','expired')]  nullable=YES
- ✅ sent_at  [timestamp]  nullable=YES
- ✅ responded_at  [timestamp]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `opened_at`, `updated_at`

## `offer_batches`
- ✅ batch_id  [int]  nullable=NO
- ✅ buyer_id  [int]  nullable=NO
- ✅ created_by  [int]  nullable=YES
- ✅ status  [enum('draft','pending_review','sent','partial_accepted','accepted','expired','cancelled')]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `supplier_id`, `total_invoice_amount`, `total_discount_amount`, `total_net_payment`, `invoice_count`, `send_mode`, `scheduled_send_at`, `sent_at`, `expires_at`

## `payments`
- ✅ payment_id  [int]  nullable=NO
- ✅ offer_id  [int]  nullable=NO
- ✅ supplier_id  [int]  nullable=NO
- ✅ amount  [decimal(15,2)]  nullable=NO
- ✅ currency  [varchar(3)]  nullable=YES
- ✅ payment_reference  [varchar(100)]  nullable=YES
- ✅ status  [enum('queued','processing','completed','failed','cancelled')]  nullable=YES
- ✅ scheduled_date  [date]  nullable=YES
- ✅ completed_date  [date]  nullable=YES
- ✅ batch_id  [varchar(100)]  nullable=YES
- ✅ processed_by  [int]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `payment_method`, `notes`, `updated_at`

## `bank_change_requests`
- ✅ request_id  [int]  nullable=NO
- ✅ supplier_id  [int]  nullable=NO
- ✅ old_bank_name  [varchar(100)]  nullable=YES
- ✅ old_account_no  [varchar(50)]  nullable=YES
- ✅ new_bank_name  [varchar(100)]  nullable=NO
- ✅ new_account_no  [varchar(50)]  nullable=NO
- ✅ new_branch_code  [varchar(20)]  nullable=NO
- ✅ new_account_type  [enum('current','savings','business')]  nullable=YES
- ✅ reason  [text]  nullable=YES
- ✅ supporting_document_url  [varchar(500)]  nullable=YES
- ✅ status  [enum('pending','approved','rejected')]  nullable=YES
- ✅ reviewed_by  [int]  nullable=YES
- ✅ reviewed_at  [timestamp]  nullable=YES
- ✅ review_notes  [text]  nullable=YES
- ✅ effective_date  [date]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES

## `buyer_documents`
- ✅ document_id  [int]  nullable=NO
- ✅ buyer_id  [int]  nullable=NO
- ✅ document_type  [enum('cipc_certificate','tax_clearance','financial_statements','bank_confirmation','trade_references','director_id','resolution','mine_permit','environmental_clearance','royalty_agreement','supply_agreement','other')]  nullable=NO
- ✅ file_name  [varchar(255)]  nullable=NO
- ✅ file_url  [varchar(500)]  nullable=NO
- ✅ file_size  [int]  nullable=YES
- ✅ uploaded_by  [int]  nullable=NO
- ✅ uploaded_at  [timestamp]  nullable=YES
- ✅ verification_status  [enum('pending','verified','rejected')]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `original_filename`, `mime_type`, `verified_by`, `verified_at`, `rejection_reason`, `expires_at`

## `buyer_change_log`
- ✅ log_id  [int]  nullable=NO
- ✅ buyer_id  [int]  nullable=NO
- ✅ field_name  [varchar(100)]  nullable=NO
- ✅ old_value  [text]  nullable=YES
- ✅ new_value  [text]  nullable=YES
- ✅ change_reason  [text]  nullable=YES
- ✅ requires_approval  [tinyint(1)]  nullable=YES
- ✅ changed_by  [int]  nullable=NO
- ✅ changed_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `approval_status`, `approved_by`, `approved_at`

## `audit_logs`
- ✅ log_id  [int]  nullable=NO
- ✅ user_id  [int]  nullable=YES
- ✅ user_type  [enum('admin','accounts_payable','supplier','system')]  nullable=NO
- ✅ action  [varchar(255)]  nullable=NO
- ✅ entity_type  [varchar(100)]  nullable=YES
- ✅ entity_id  [int]  nullable=YES
- ✅ details  [text]  nullable=YES
- ✅ ip_address  [varchar(45)]  nullable=YES
- ✅ user_agent  [text]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES

## `supplier_tokens`
- ✅ token_id  [int]  nullable=NO
- ✅ supplier_id  [int]  nullable=NO
- ✅ token  [varchar(255)]  nullable=NO
- ✅ token_type  [enum('invite','reset_password','offer_access','approval')]  nullable=YES
- ✅ expires_at  [timestamp]  nullable=NO
- ✅ used_at  [timestamp]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `short_code`

## `rate_cards`
- ✅ rate_card_id  [int]  nullable=NO
- ✅ name  [varchar(100)]  nullable=NO
- ✅ description  [text]  nullable=YES
- ✅ base_annual_rate  [decimal(5,2)]  nullable=NO
- ✅ tier_a_adjustment  [decimal(5,2)]  nullable=YES
- ✅ tier_b_adjustment  [decimal(5,2)]  nullable=YES
- ✅ tier_c_adjustment  [decimal(5,2)]  nullable=YES
- ✅ is_active  [tinyint(1)]  nullable=YES
- ✅ created_at  [timestamp]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES
- ℹ️  Extra columns (not in backend requirements): `days_brackets`, `is_default`, `created_by`

## `system_settings`
- ✅ setting_id  [int]  nullable=NO
- ✅ setting_key  [varchar(100)]  nullable=NO
- ✅ setting_value  [text]  nullable=YES
- ✅ setting_type  [enum('string','number','boolean','json')]  nullable=YES
- ✅ description  [text]  nullable=YES
- ✅ updated_by  [int]  nullable=YES
- ✅ updated_at  [timestamp]  nullable=YES

# 4. ENUM Value Validation
Every ENUM column used in backend code is verified to contain required values.


## `cession_agreements.status`
- ℹ️  Raw ENUM: `pending', 'signed', 'buyer_approved', 'approved', 'rejected`
- ✅ 'pending' present
- ✅ 'signed' present
- ✅ 'buyer_approved' present
- ✅ 'approved' present
- ✅ 'rejected' present

## `buyers.payment_capture_type`
- ℹ️  Raw ENUM: `weekly', 'monthly`
- ✅ 'weekly' present
- ✅ 'monthly' present

## `suppliers.bank_account_type`
- ℹ️  Raw ENUM: `current', 'savings', 'business`
- ✅ 'current' present
- ✅ 'savings' present
- ✅ 'business' present

## `suppliers.onboarding_status`
- ℹ️  Raw ENUM: `pending', 'documents_submitted', 'approved', 'rejected`
- ✅ 'pending' present
- ✅ 'documents_submitted' present
- ✅ 'approved' present
- ✅ 'rejected' present

## `suppliers.active_status`
- ℹ️  Raw ENUM: `active', 'inactive', 'suspended`
- ✅ 'active' present
- ✅ 'inactive' present
- ✅ 'suspended' present

## `invoices.status`
- ℹ️  Raw ENUM: `pending', 'matched', 'offered', 'accepted', 'paid', 'rejected`
- ✅ 'pending' present
- ✅ 'matched' present
- ✅ 'offered' present
- ✅ 'accepted' present
- ✅ 'paid' present
- ✅ 'rejected' present

## `offers.status`
- ℹ️  Raw ENUM: `draft', 'sent', 'opened', 'accepted', 'rejected', 'expired`
- ✅ 'sent' present
- ✅ 'opened' present
- ✅ 'accepted' present
- ✅ 'rejected' present
- ✅ 'expired' present
- ℹ️  Extra ENUM values (not checked): 'draft'

## `payments.status`
- ℹ️  Raw ENUM: `queued', 'processing', 'completed', 'failed', 'cancelled`
- ✅ 'queued' present
- ✅ 'processing' present
- ✅ 'completed' present
- ✅ 'failed' present
- ✅ 'cancelled' present

## `bank_change_requests.status`
- ℹ️  Raw ENUM: `pending', 'approved', 'rejected`
- ✅ 'pending' present
- ✅ 'approved' present
- ✅ 'rejected' present

## `users.role`
- ℹ️  Raw ENUM: `admin', 'accounts_payable', 'auditor`
- ✅ 'admin' present
- ✅ 'accounts_payable' present
- ✅ 'auditor' present

# 5. Foreign Key Constraints

| Table | Constraint | Column | → Table | → Column | On Delete |
|-------|-----------|--------|---------|---------|-----------|
| `audit_logs` | `audit_logs_ibfk_1` | `user_id` | `users` | `user_id` | SET NULL |
| `bank_change_requests` | `bank_change_requests_ibfk_1` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `bank_change_requests` | `bank_change_requests_ibfk_2` | `reviewed_by` | `users` | `user_id` | SET NULL |
| `buyer_change_log` | `buyer_change_log_ibfk_1` | `buyer_id` | `buyers` | `buyer_id` | CASCADE |
| `buyer_documents` | `buyer_documents_ibfk_1` | `buyer_id` | `buyers` | `buyer_id` | CASCADE |
| `cession_agreements` | `cession_agreements_ibfk_1` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `cession_agreements` | `cession_agreements_ibfk_2` | `approved_by` | `users` | `user_id` | SET NULL |
| `cession_agreements` | `fk_cession_buyer` | `buyer_id` | `buyers` | `buyer_id` | SET NULL |
| `cession_agreements` | `fk_cession_buyer_approved_by` | `buyer_approved_by` | `users` | `user_id` | SET NULL |
| `cession_agreements` | `fk_parent_cession` | `parent_cession_id` | `cession_agreements` | `cession_id` | SET NULL |
| `invoices` | `invoices_ibfk_1` | `buyer_id` | `buyers` | `buyer_id` | CASCADE |
| `invoices` | `invoices_ibfk_2` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `invoices` | `invoices_ibfk_3` | `uploaded_by` | `users` | `user_id` | SET NULL |
| `offer_batches` | `offer_batches_ibfk_1` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `offer_batches` | `offer_batches_ibfk_2` | `buyer_id` | `buyers` | `buyer_id` | CASCADE |
| `offer_batches` | `offer_batches_ibfk_3` | `created_by` | `users` | `user_id` | SET NULL |
| `offers` | `fk_offers_batch` | `batch_id` | `offer_batches` | `batch_id` | SET NULL |
| `offers` | `offers_ibfk_1` | `invoice_id` | `invoices` | `invoice_id` | CASCADE |
| `offers` | `offers_ibfk_2` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `offers` | `offers_ibfk_3` | `buyer_id` | `buyers` | `buyer_id` | CASCADE |
| `otp_codes` | `otp_codes_ibfk_1` | `user_id` | `users` | `user_id` | CASCADE |
| `payments` | `payments_ibfk_1` | `offer_id` | `offers` | `offer_id` | CASCADE |
| `payments` | `payments_ibfk_2` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `payments` | `payments_ibfk_3` | `processed_by` | `users` | `user_id` | SET NULL |
| `repayments` | `repayments_ibfk_1` | `payment_id` | `payments` | `payment_id` | CASCADE |
| `repayments` | `repayments_ibfk_2` | `buyer_id` | `buyers` | `buyer_id` | CASCADE |
| `supplier_tokens` | `supplier_tokens_ibfk_1` | `supplier_id` | `suppliers` | `supplier_id` | CASCADE |
| `system_settings` | `system_settings_ibfk_1` | `updated_by` | `users` | `user_id` | SET NULL |
| `trusted_devices` | `trusted_devices_ibfk_1` | `user_id` | `users` | `user_id` | CASCADE |
| `users` | `users_ibfk_1` | `buyer_id` | `buyers` | `buyer_id` | SET NULL |

## Critical FK Checks
- ✅ FK for buyer_id
- ✅ FK for buyer_approved_by (migration 12)
- ✅ FK invoices.buyer_id
- ✅ FK offers.buyer_id
- ✅ FK users.buyer_id

# 6. Indexes

| Table | Index | Unique | Columns |
|-------|-------|--------|---------|
| `audit_logs` | `idx_action` | no | action |
| `audit_logs` | `idx_created_at` | no | created_at |
| `audit_logs` | `idx_user_id` | no | user_id |
| `audit_logs` | `PRIMARY` | YES | log_id |
| `bank_change_requests` | `idx_status` | no | status |
| `bank_change_requests` | `idx_supplier_id` | no | supplier_id |
| `bank_change_requests` | `PRIMARY` | YES | request_id |
| `bank_change_requests` | `reviewed_by` | no | reviewed_by |
| `buyer_change_log` | `idx_buyer_changes_buyer` | no | buyer_id |
| `buyer_change_log` | `idx_buyer_changes_field` | no | field_name |
| `buyer_change_log` | `idx_buyer_changes_status` | no | approval_status |
| `buyer_change_log` | `PRIMARY` | YES | log_id |
| `buyer_documents` | `idx_buyer_docs_buyer` | no | buyer_id |
| `buyer_documents` | `idx_buyer_docs_status` | no | verification_status |
| `buyer_documents` | `idx_buyer_docs_type` | no | document_type |
| `buyer_documents` | `PRIMARY` | YES | document_id |
| `buyers` | `code` | YES | code |
| `buyers` | `idx_active_status` | no | active_status |
| `buyers` | `idx_buyers_industry` | no | industry_sector |
| `buyers` | `idx_buyers_rate_card` | no | rate_card_id |
| `buyers` | `idx_buyers_risk_tier` | no | risk_tier |
| `buyers` | `idx_buyers_status` | no | active_status |
| `buyers` | `idx_code` | no | code |
| `buyers` | `PRIMARY` | YES | buyer_id |
| `cession_agreements` | `approved_by` | no | approved_by |
| `cession_agreements` | `fk_cession_buyer_approved_by` | no | buyer_approved_by |
| `cession_agreements` | `fk_parent_cession` | no | parent_cession_id |
| `cession_agreements` | `idx_cession_status_buyer` | no | buyer_id, status |
| `cession_agreements` | `idx_status` | no | status |
| `cession_agreements` | `idx_supplier_id` | no | supplier_id |
| `cession_agreements` | `PRIMARY` | YES | cession_id |
| `email_templates` | `PRIMARY` | YES | template_id |
| `email_templates` | `template_key` | YES | template_key |
| `invoices` | `idx_document_number` | no | document_number |
| `invoices` | `idx_due_date` | no | due_date |
| `invoices` | `idx_status` | no | status |
| `invoices` | `idx_vendor_number` | no | vendor_number |
| `invoices` | `PRIMARY` | YES | invoice_id |
| `invoices` | `supplier_id` | no | supplier_id |
| `invoices` | `unique_invoice` | YES | buyer_id, invoice_number |
| `invoices` | `uploaded_by` | no | uploaded_by |
| `notification_rules` | `idx_is_active` | no | is_active |
| `notification_rules` | `idx_trigger_event` | no | trigger_event |
| `notification_rules` | `PRIMARY` | YES | rule_id |
| `notifications` | `idx_created_at` | no | created_at |
| `notifications` | `idx_recipient` | no | recipient_type, recipient_id |
| `notifications` | `idx_status` | no | status |
| `notifications` | `PRIMARY` | YES | notification_id |
| `offer_batches` | `created_by` | no | created_by |
| `offer_batches` | `idx_buyer_id` | no | buyer_id |
| `offer_batches` | `idx_status` | no | status |
| `offer_batches` | `idx_supplier_id` | no | supplier_id |
| `offer_batches` | `PRIMARY` | YES | batch_id |
| `offers` | `buyer_id` | no | buyer_id |
| `offers` | `fk_offers_batch` | no | batch_id |
| `offers` | `idx_offer_expiry_date` | no | offer_expiry_date |
| `offers` | `idx_status` | no | status |
| `offers` | `idx_supplier_id` | no | supplier_id |
| `offers` | `invoice_id` | no | invoice_id |
| `offers` | `PRIMARY` | YES | offer_id |
| `otp_codes` | `idx_expires_at` | no | expires_at |
| `otp_codes` | `idx_user_id` | no | user_id |
| `otp_codes` | `PRIMARY` | YES | otp_id |
| `payments` | `idx_batch_id` | no | batch_id |
| `payments` | `idx_scheduled_date` | no | scheduled_date |
| `payments` | `idx_status` | no | status |
| `payments` | `offer_id` | no | offer_id |
| `payments` | `payment_reference` | YES | payment_reference |
| `payments` | `PRIMARY` | YES | payment_id |
| `payments` | `processed_by` | no | processed_by |
| `payments` | `supplier_id` | no | supplier_id |
| `rate_cards` | `idx_rate_cards_active` | no | is_active |
| `rate_cards` | `idx_rate_cards_default` | no | is_default |
| `rate_cards` | `PRIMARY` | YES | rate_card_id |
| `repayments` | `buyer_id` | no | buyer_id |
| `repayments` | `idx_due_date` | no | due_date |
| `repayments` | `idx_status` | no | status |
| `repayments` | `payment_id` | no | payment_id |
| `repayments` | `PRIMARY` | YES | repayment_id |
| `supplier_tokens` | `idx_expires_at` | no | expires_at |
| `supplier_tokens` | `idx_short_code` | no | short_code |
| `supplier_tokens` | `idx_token` | no | token |
| `supplier_tokens` | `PRIMARY` | YES | token_id |
| `supplier_tokens` | `supplier_id` | no | supplier_id |
| `supplier_tokens` | `token` | YES | token |
| `suppliers` | `idx_active_status` | no | active_status |
| `suppliers` | `idx_onboarding_status` | no | onboarding_status |
| `suppliers` | `idx_vat_no` | no | vat_no |
| `suppliers` | `idx_vendor_number` | no | vendor_number |
| `suppliers` | `PRIMARY` | YES | supplier_id |
| `suppliers` | `vat_no` | YES | vat_no |
| `suppliers` | `vendor_number` | YES | vendor_number |
| `system_settings` | `PRIMARY` | YES | setting_id |
| `system_settings` | `setting_key` | YES | setting_key |
| `system_settings` | `updated_by` | no | updated_by |
| `trusted_devices` | `idx_fingerprint` | no | device_fingerprint |
| `trusted_devices` | `idx_trusted_until` | no | trusted_until |
| `trusted_devices` | `idx_user_id` | no | user_id |
| `trusted_devices` | `PRIMARY` | YES | device_id |
| `users` | `buyer_id` | no | buyer_id |
| `users` | `email` | YES | email |
| `users` | `idx_email` | no | email |
| `users` | `idx_role` | no | role |
| `users` | `idx_username` | no | username |
| `users` | `idx_users_activation` | no | activation_token |
| `users` | `idx_users_must_change` | no | must_change_password |
| `users` | `PRIMARY` | YES | user_id |
| `users` | `username` | YES | username |

## Expected Index Checks
- ✅ `cession_agreements.idx_cession_status_buyer` — buyer_id + status (migration 12 perf)
- ✅ `suppliers.idx_onboarding_status` — supplier onboarding queries
- ✅ `invoices.idx_status` — invoice status filter
- ✅ `offers.idx_status` — offer status filter
- ✅ `supplier_tokens.idx_expires_at` — token expiry cleanup

# 7. Live Data Snapshots

## cession_agreements — status × is_standing

| status | is_standing | count |
|--------|------------|-------|
| approved | 0 | 12 |

## buyers — require_cession_approval distribution

| require_cession_approval | count |
|--------------------------|-------|
| 0 | 6 |

## invoices — status distribution

| status | count |
|--------|-------|
| matched | 9 |
| offered | 5 |
| accepted | 3 |

## offers — status distribution

| status | count |
|--------|-------|
| sent | 5 |
| accepted | 3 |

## buyers — payment_capture_type distribution

| payment_capture_type | count |
|----------------------|-------|
| NULL | 6 |

## suppliers — mine_cession_approved distribution

| mine_cession_approved | count |
|-----------------------|-------|
| 0 | 11 |

## bank_change_requests — status distribution

| status | count |
|--------|-------|
- ℹ️  Table is empty

## users — role distribution

| role | has_buyer_id | count |
|------|-------------|-------|
| admin | 0 | 1 |
| accounts_payable | 1 | 6 |

## buyer_documents — document_type distribution

| document_type | verification_status | count |
|---------------|---------------------|-------|
- ℹ️  buyer_documents table is empty

## payments — status distribution

| status | count | total_amount |
|--------|-------|-------------|
| queued | 2 | 83144.47 |
| completed | 1 | 867208.90 |

# 8. Data Integrity Checks

## cession_agreements with NULL buyer_id
- ✅ All cession_agreements have buyer_id set

## offers with no matching invoice
- ✅ No orphan offers

## offers=accepted but invoice≠accepted
- ✅ offers/invoice status sync is consistent

## approved suppliers with no access token
- ✅ All approved suppliers have at least one token

## accounts_payable users with no buyer_id
- ✅ All AP users have buyer_id set

## suppliers with multiple standing cessions
- ✅ No duplicate standing cessions

## invoices with invalid buyer_id
- ✅ All invoices reference a valid buyer

# 9. Migration 12 Status (Buyer Cession Approval)
- ✅ cession_agreements.buyer_approved_by exists
- ✅ cession_agreements.buyer_approved_at exists
- ✅ cession_agreements.status ENUM includes 'buyer_approved'
- ✅ FK fk_cession_buyer_approved_by exists
- ✅ Index idx_cession_status_buyer exists

# Summary

| | Count |
|--|-------|
| ✅ Passed | **260** |
| ❌ Failed | **0** |
| ⚠️  Warnings | **0** |

> **All checks passed. DB schema and backend are fully aligned.**

---
*Report generated automatically by `scripts/db-full-report.js`*