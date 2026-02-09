-- ============================================================================
-- 06-security-enhancements-schema.sql
-- Security Enhancement Schema Updates
-- 
-- This migration adds columns required for:
-- - Two-Factor Authentication (TOTP)
-- - Session binding and security tracking
-- - Enhanced audit logging
-- 
-- Run with: mysql -u <user> -p <database> < scripts/06-security-enhancements-schema.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: Two-Factor Authentication for Admin Users
-- ============================================================================

-- Add TOTP 2FA columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64) NULL 
    COMMENT 'Encrypted TOTP secret key (base32 encoded)',
  ADD COLUMN IF NOT EXISTS totp_secret_pending VARCHAR(64) NULL 
    COMMENT 'Pending TOTP secret during setup (not yet verified)',
  ADD COLUMN IF NOT EXISTS totp_pending_at DATETIME NULL 
    COMMENT 'When pending TOTP secret was generated',
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE NOT NULL 
    COMMENT 'Whether 2FA is enabled for this user',
  ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT NULL 
    COMMENT 'JSON array of hashed backup codes',
  ADD COLUMN IF NOT EXISTS totp_enabled_at DATETIME NULL 
    COMMENT 'When 2FA was enabled';

-- Index for quick lookup of 2FA enabled users
CREATE INDEX IF NOT EXISTS idx_users_totp_enabled ON users(totp_enabled);

-- ============================================================================
-- SECTION 2: Session Security and Tracking
-- ============================================================================

-- Create sessions table for server-side session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_type ENUM('admin', 'accounts_payable', 'supplier') NOT NULL,
  session_token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of session token',
  ip_address_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash of IP for binding',
  user_agent_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash of User-Agent for binding',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at DATETIME NULL,
  revoked_reason VARCHAR(255) NULL,
  
  INDEX idx_session_user (user_id, user_type),
  INDEX idx_session_token (session_token_hash),
  INDEX idx_session_expires (expires_at),
  INDEX idx_session_revoked (revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 3: Enhanced Audit Log
-- ============================================================================

-- Ensure audit_logs table has all required columns
-- (This may already exist, so we use ALTER TABLE ADD IF NOT EXISTS pattern)

-- Add additional audit columns if they don't exist
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL 
    COMMENT 'IPv4 or IPv6 address',
  ADD COLUMN IF NOT EXISTS user_agent TEXT NULL 
    COMMENT 'Full User-Agent header',
  ADD COLUMN IF NOT EXISTS request_id VARCHAR(36) NULL 
    COMMENT 'Request correlation ID',
  ADD COLUMN IF NOT EXISTS session_id VARCHAR(64) NULL 
    COMMENT 'Associated session token hash',
  ADD COLUMN IF NOT EXISTS severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info' 
    COMMENT 'Log severity level';

-- Index for security event queries
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_logs(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_logs(ip_address, created_at);

-- ============================================================================
-- SECTION 4: Security Events Log
-- ============================================================================

-- Create dedicated security events table for high-priority security logging
CREATE TABLE IF NOT EXISTS security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type ENUM('authentication', 'authorization', 'rate_limit', 'security_violation', 'session') NOT NULL,
  action VARCHAR(100) NOT NULL,
  outcome ENUM('success', 'failure', 'blocked') NOT NULL,
  severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  user_id INT NULL,
  user_type VARCHAR(50) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  resource VARCHAR(255) NULL,
  details JSON NULL COMMENT 'Additional event-specific details',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_security_event_type (event_type, created_at),
  INDEX idx_security_severity (severity, created_at),
  INDEX idx_security_user (user_id, created_at),
  INDEX idx_security_ip (ip_address, created_at),
  INDEX idx_security_outcome (outcome, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 5: Failed Login Tracking
-- ============================================================================

-- Create table for tracking failed login attempts (for lockout mechanism)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL COMMENT 'Email or username attempted',
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  attempt_type ENUM('password', 'otp', '2fa') DEFAULT 'password',
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_login_identifier (identifier, created_at),
  INDEX idx_login_ip (ip_address, created_at),
  INDEX idx_login_success (success, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 6: Rate Limiting Persistence (Optional)
-- ============================================================================

-- Create table for persistent rate limiting (alternative to Redis)
CREATE TABLE IF NOT EXISTS rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL COMMENT 'IP address or user ID',
  endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint or action',
  window_start DATETIME NOT NULL,
  request_count INT DEFAULT 1,
  blocked_until DATETIME NULL,
  
  UNIQUE KEY uk_rate_limit (identifier, endpoint, window_start),
  INDEX idx_rate_limit_window (window_start),
  INDEX idx_rate_limit_blocked (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 7: Cleanup Procedures
-- ============================================================================

-- Create stored procedure to clean up old data
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS cleanup_security_data()
BEGIN
  -- Remove expired sessions
  DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL 7 DAY;
  
  -- Remove old login attempts (keep 30 days)
  DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL 30 DAY;
  
  -- Remove old rate limit entries (keep 1 day)
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL 1 DAY;
  
  -- Archive/remove old security events (keep 90 days in main table)
  DELETE FROM security_events WHERE created_at < NOW() - INTERVAL 90 DAY;
END //

DELIMITER ;

-- ============================================================================
-- SECTION 8: Event to run cleanup daily
-- ============================================================================

-- Create event scheduler for automatic cleanup (requires EVENT privilege)
-- Note: Ensure event_scheduler is enabled in MySQL config

CREATE EVENT IF NOT EXISTS security_data_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL cleanup_security_data();

-- ============================================================================
-- Migration Notes:
-- 
-- 1. TOTP secrets should be encrypted at rest using application-level encryption
--    before storing in the database.
--
-- 2. Consider adding database-level encryption (TDE) for additional security.
--
-- 3. Backup codes are stored as hashed values, never plaintext.
--
-- 4. The security_events table provides a dedicated audit trail for 
--    security-critical events separate from general application audit logs.
--
-- 5. The cleanup procedure helps maintain database performance by removing
--    old transient security data.
--
-- 6. For production, consider partitioning large tables like security_events
--    and login_attempts by date for better performance.
-- ============================================================================
