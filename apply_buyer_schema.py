import mysql.connector

conn = mysql.connector.connect(
    host='futurefinancecashflow.mysql.database.azure.com',
    user='FMadmin',
    password='REDACTED_DB_PASSWORD',
    database='fmf_scf_platform',
    ssl_disabled=False,
    ssl_verify_cert=False,
    ssl_verify_identity=False
)
cursor = conn.cursor()

print('='*60)
print('APPLYING BUYER ONBOARDING SCHEMA')
print('='*60)

# Execute each ALTER statement separately to handle potential errors
statements = [
    # 1. BUYERS TABLE ENHANCEMENTS
    ("Adding trading_name to buyers", 
     "ALTER TABLE buyers ADD COLUMN trading_name VARCHAR(255) NULL AFTER name"),
    
    ("Adding registration_no to buyers", 
     "ALTER TABLE buyers ADD COLUMN registration_no VARCHAR(100) NULL AFTER trading_name"),
    
    ("Adding tax_id to buyers", 
     "ALTER TABLE buyers ADD COLUMN tax_id VARCHAR(50) NULL AFTER registration_no"),
    
    ("Adding industry_sector to buyers", 
     "ALTER TABLE buyers ADD COLUMN industry_sector ENUM('mining', 'manufacturing', 'retail', 'construction', 'agriculture', 'services', 'other') DEFAULT 'mining' AFTER tax_id"),
    
    ("Adding risk_tier to buyers", 
     "ALTER TABLE buyers ADD COLUMN risk_tier ENUM('A', 'B', 'C') DEFAULT 'B' AFTER industry_sector"),
    
    ("Adding physical_address_street to buyers", 
     "ALTER TABLE buyers ADD COLUMN physical_address_street VARCHAR(255) NULL AFTER risk_tier"),
    
    ("Adding physical_address_city to buyers", 
     "ALTER TABLE buyers ADD COLUMN physical_address_city VARCHAR(100) NULL AFTER physical_address_street"),
    
    ("Adding physical_address_province to buyers", 
     "ALTER TABLE buyers ADD COLUMN physical_address_province VARCHAR(100) NULL AFTER physical_address_city"),
    
    ("Adding physical_address_postal to buyers", 
     "ALTER TABLE buyers ADD COLUMN physical_address_postal VARCHAR(20) NULL AFTER physical_address_province"),
    
    ("Adding primary_contact_name to buyers", 
     "ALTER TABLE buyers ADD COLUMN primary_contact_name VARCHAR(255) NULL AFTER physical_address_postal"),
    
    ("Adding financial_contact_name to buyers", 
     "ALTER TABLE buyers ADD COLUMN financial_contact_name VARCHAR(255) NULL AFTER contact_phone"),
    
    ("Adding financial_contact_email to buyers", 
     "ALTER TABLE buyers ADD COLUMN financial_contact_email VARCHAR(255) NULL AFTER financial_contact_name"),
    
    ("Adding min_invoice_amount to buyers", 
     "ALTER TABLE buyers ADD COLUMN min_invoice_amount DECIMAL(15,2) DEFAULT 1000.00 AFTER financial_contact_email"),
    
    ("Adding max_invoice_amount to buyers", 
     "ALTER TABLE buyers ADD COLUMN max_invoice_amount DECIMAL(15,2) DEFAULT 5000000.00 AFTER min_invoice_amount"),
    
    ("Adding min_days_to_maturity to buyers", 
     "ALTER TABLE buyers ADD COLUMN min_days_to_maturity INT DEFAULT 7 AFTER max_invoice_amount"),
    
    ("Adding max_days_to_maturity to buyers", 
     "ALTER TABLE buyers ADD COLUMN max_days_to_maturity INT DEFAULT 90 AFTER min_days_to_maturity"),
    
    ("Adding credit_limit to buyers", 
     "ALTER TABLE buyers ADD COLUMN credit_limit DECIMAL(15,2) NULL AFTER max_days_to_maturity"),
    
    ("Adding current_exposure to buyers", 
     "ALTER TABLE buyers ADD COLUMN current_exposure DECIMAL(15,2) DEFAULT 0.00 AFTER credit_limit"),
    
    ("Adding rate_card_id to buyers", 
     "ALTER TABLE buyers ADD COLUMN rate_card_id INT NULL AFTER current_exposure"),
    
    ("Adding created_by to buyers", 
     "ALTER TABLE buyers ADD COLUMN created_by INT NULL AFTER rate_card_id"),
    
    ("Adding approved_by to buyers", 
     "ALTER TABLE buyers ADD COLUMN approved_by INT NULL AFTER created_by"),
    
    ("Adding approved_at to buyers", 
     "ALTER TABLE buyers ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by"),
    
    ("Modifying active_status ENUM in buyers", 
     "ALTER TABLE buyers MODIFY COLUMN active_status ENUM('draft', 'active', 'inactive', 'suspended') DEFAULT 'active'"),
    
    # 2. USERS TABLE ENHANCEMENTS
    ("Adding must_change_password to users", 
     "ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0 AFTER active_status"),
    
    ("Adding is_email_verified to users", 
     "ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) DEFAULT 0 AFTER must_change_password"),
    
    ("Adding activation_token to users", 
     "ALTER TABLE users ADD COLUMN activation_token VARCHAR(255) NULL AFTER is_email_verified"),
    
    ("Adding activation_expires_at to users", 
     "ALTER TABLE users ADD COLUMN activation_expires_at TIMESTAMP NULL AFTER activation_token"),
    
    # 3. CREATE RATE_CARDS TABLE
    ("Creating rate_cards table", '''
        CREATE TABLE IF NOT EXISTS rate_cards (
            rate_card_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT NULL,
            base_annual_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
            tier_a_adjustment DECIMAL(5,2) DEFAULT -2.00,
            tier_b_adjustment DECIMAL(5,2) DEFAULT 0.00,
            tier_c_adjustment DECIMAL(5,2) DEFAULT 3.00,
            days_brackets JSON NULL,
            is_default TINYINT(1) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_rate_cards_default (is_default),
            INDEX idx_rate_cards_active (is_active)
        )
    '''),
    
    ("Inserting default rate card", '''
        INSERT INTO rate_cards (name, description, base_annual_rate, is_default, is_active) 
        SELECT 'Standard Rate Card', 'Default rate card for all buyers', 18.00, 1, 1
        FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE is_default = 1)
    '''),
    
    # 4. CREATE BUYER_DOCUMENTS TABLE
    ("Creating buyer_documents table", '''
        CREATE TABLE IF NOT EXISTS buyer_documents (
            document_id INT AUTO_INCREMENT PRIMARY KEY,
            buyer_id INT NOT NULL,
            document_type ENUM(
                'cipc_certificate',
                'tax_clearance',
                'financial_statements',
                'bank_confirmation',
                'trade_references',
                'director_id',
                'resolution',
                'other'
            ) NOT NULL,
            document_name VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NULL,
            blob_url VARCHAR(500) NOT NULL,
            file_size INT NULL,
            mime_type VARCHAR(100) NULL,
            verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
            verified_by INT NULL,
            verified_at TIMESTAMP NULL,
            rejection_reason TEXT NULL,
            expires_at DATE NULL,
            uploaded_by INT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
            INDEX idx_buyer_docs_buyer (buyer_id),
            INDEX idx_buyer_docs_type (document_type),
            INDEX idx_buyer_docs_status (verification_status)
        )
    '''),
    
    # 5. CREATE BUYER_CHANGE_LOG TABLE
    ("Creating buyer_change_log table", '''
        CREATE TABLE IF NOT EXISTS buyer_change_log (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            buyer_id INT NOT NULL,
            field_name VARCHAR(100) NOT NULL,
            old_value TEXT NULL,
            new_value TEXT NULL,
            change_reason TEXT NULL,
            requires_approval TINYINT(1) DEFAULT 0,
            approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
            approved_by INT NULL,
            approved_at TIMESTAMP NULL,
            changed_by INT NOT NULL,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
            INDEX idx_buyer_changes_buyer (buyer_id),
            INDEX idx_buyer_changes_field (field_name),
            INDEX idx_buyer_changes_status (approval_status)
        )
    '''),
]

success_count = 0
error_count = 0

for description, sql in statements:
    try:
        cursor.execute(sql)
        conn.commit()
        print(f"  ✅ {description}")
        success_count += 1
    except mysql.connector.Error as err:
        if 'Duplicate column name' in str(err) or 'already exists' in str(err).lower():
            print(f"  ⏭️  {description} (already exists)")
            success_count += 1
        else:
            print(f"  ❌ {description}: {err}")
            error_count += 1

# Create indexes (may fail if they exist)
indexes = [
    ("Creating idx_buyers_risk_tier", "CREATE INDEX idx_buyers_risk_tier ON buyers(risk_tier)"),
    ("Creating idx_buyers_industry", "CREATE INDEX idx_buyers_industry ON buyers(industry_sector)"),
    ("Creating idx_buyers_status", "CREATE INDEX idx_buyers_status ON buyers(active_status)"),
    ("Creating idx_buyers_rate_card", "CREATE INDEX idx_buyers_rate_card ON buyers(rate_card_id)"),
    ("Creating idx_users_activation", "CREATE INDEX idx_users_activation ON users(activation_token)"),
    ("Creating idx_users_must_change", "CREATE INDEX idx_users_must_change ON users(must_change_password)"),
]

print("\n--- Creating indexes ---")
for description, sql in indexes:
    try:
        cursor.execute(sql)
        conn.commit()
        print(f"  ✅ {description}")
        success_count += 1
    except mysql.connector.Error as err:
        if 'Duplicate key name' in str(err):
            print(f"  ⏭️  {description} (already exists)")
        else:
            print(f"  ❌ {description}: {err}")

cursor.close()
conn.close()

print('\n' + '='*60)
print(f'MIGRATION COMPLETE: {success_count} successful, {error_count} errors')
print('='*60)
