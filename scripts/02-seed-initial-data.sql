-- FMF Supply Chain Finance Platform - Initial Seed Data
USE fmf_scf_platform;

-- Insert default buyers (mining companies)
INSERT INTO buyers (name, code, contact_email, contact_phone, active_status) VALUES
('Anglo American Platinum', 'AAP001', 'ap@angloplat.com', '+27 11 373 6111', 'active'),
('Sibanye-Stillwater', 'SSW001', 'ap@sibanyestillwater.com', '+27 11 376 9111', 'active'),
('Harmony Gold Mining', 'HGM001', 'ap@harmony.co.za', '+27 11 411 2000', 'active');

-- Insert default admin user (password: Admin@123 - hashed with bcrypt)
-- Note: In production, use proper bcrypt hashing
INSERT INTO users (username, email, password_hash, role, full_name, active_status) VALUES
('admin', 'admin@fmf.co.za', '$2a$10$rKZLvXZvXZvXZvXZvXZvXeExample', 'admin', 'FMF Administrator', 'active');

-- Insert sample AP users for each buyer
INSERT INTO users (username, email, password_hash, role, buyer_id, full_name, active_status) VALUES
('aap_ap', 'ap@angloplat.com', '$2a$10$rKZLvXZvXZvXZvXZvXZvXeExample', 'accounts_payable', 1, 'Anglo AP User', 'active'),
('ssw_ap', 'ap@sibanyestillwater.com', '$2a$10$rKZLvXZvXZvXZvXZvXZvXeExample', 'accounts_payable', 2, 'Sibanye AP User', 'active'),
('hgm_ap', 'ap@harmony.co.za', '$2a$10$rKZLvXZvXZvXZvXZvXZvXeExample', 'accounts_payable', 3, 'Harmony AP User', 'active');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('default_annual_rate', '12.5', 'number', 'Default annual discount rate for offers (%)'),
('offer_expiry_days', '7', 'number', 'Number of days before an offer expires'),
('token_expiry_days', '14', 'number', 'Number of days before supplier invite token expires'),
('otp_expiry_minutes', '10', 'number', 'Number of minutes before OTP code expires'),
('max_failed_login_attempts', '3', 'number', 'Maximum failed login attempts before account lock'),
('session_timeout_minutes', '30', 'number', 'Session timeout in minutes'),
('payment_batch_prefix', 'FMF', 'string', 'Prefix for payment batch references'),
('notification_from_email', 'noreply@fmf.co.za', 'string', 'From email address for notifications');

-- Insert sample suppliers
INSERT INTO suppliers (name, vat_no, registration_no, contact_person, contact_email, contact_phone, 
  bank_name, bank_account_no, bank_branch_code, bank_account_type, risk_tier, onboarding_status, active_status) VALUES
('ABC Mining Supplies', '4123456789', '2020/123456/07', 'John Smith', 'john@abcmining.co.za', '+27 11 123 4567',
  'Standard Bank', '123456789', '051001', 'business', 'low', 'approved', 'active'),
('XYZ Equipment Rentals', '4987654321', '2019/987654/07', 'Jane Doe', 'jane@xyzequip.co.za', '+27 21 987 6543',
  'FNB', '987654321', '250655', 'business', 'medium', 'approved', 'active');
