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
cursor = conn.cursor(dictionary=True)

print('='*60)
print('BUYER ONBOARDING - DATABASE ANALYSIS')
print('='*60)

# 1. Check BUYERS table structure
print('\n=== BUYERS TABLE STRUCTURE ===')
cursor.execute('DESCRIBE buyers')
for row in cursor.fetchall():
    default_val = row['Default'] if row['Default'] is not None else ''
    print(f"  {row['Field']:30} {row['Type']:30} {row['Null']:5} {default_val}")

# 2. Check current buyers data
print('\n=== CURRENT BUYERS DATA ===')
cursor.execute('SELECT * FROM buyers')
buyers = cursor.fetchall()
for row in buyers:
    print(row)
print(f'\nTotal Buyers: {len(buyers)}')

# 3. Check USERS table structure
print('\n=== USERS TABLE STRUCTURE ===')
cursor.execute('DESCRIBE users')
for row in cursor.fetchall():
    default_val = row['Default'] if row['Default'] is not None else ''
    print(f"  {row['Field']:30} {row['Type']:30} {row['Null']:5} {default_val}")

# 4. Check AP users per buyer
print('\n=== AP USERS PER BUYER ===')
cursor.execute('''
    SELECT b.buyer_id, b.name as buyer_name, b.code,
           COUNT(u.user_id) as ap_user_count,
           GROUP_CONCAT(u.username) as usernames
    FROM buyers b
    LEFT JOIN users u ON b.buyer_id = u.buyer_id AND u.role = 'accounts_payable'
    GROUP BY b.buyer_id, b.name, b.code
''')
for row in cursor.fetchall():
    buyer_name = row['buyer_name'][:30] if row['buyer_name'] else 'Unknown'
    code = row['code'] or 'N/A'
    usernames = row['usernames'] or 'none'
    print(f"  {buyer_name:30} Code: {code:10} AP Users: {row['ap_user_count']} ({usernames})")

# 5. Check what tables exist
print('\n=== ALL TABLES IN DATABASE ===')
cursor.execute('SHOW TABLES')
tables = cursor.fetchall()
for row in tables:
    table_name = list(row.values())[0]
    cursor.execute(f'SELECT COUNT(*) as cnt FROM `{table_name}`')
    count = cursor.fetchone()['cnt']
    print(f"  {table_name:30} {count} rows")

# 6. Check if Phase 1 tables exist
print('\n=== PHASE 1 TABLES CHECK ===')
phase1_tables = ['offer_batches', 'trusted_devices', 'notification_rules', 'email_templates']
for table in phase1_tables:
    cursor.execute(f"SHOW TABLES LIKE '{table}'")
    exists = cursor.fetchone()
    status = 'EXISTS' if exists else 'MISSING'
    print(f"  {table:25} {status}")

# 7. Check if cession_agreements has standing cession columns
print('\n=== CESSION_AGREEMENTS STANDING CESSION COLUMNS ===')
cursor.execute('DESCRIBE cession_agreements')
cols = [row['Field'] for row in cursor.fetchall()]
standing_cols = ['is_standing', 'standing_valid_until', 'parent_cession_id', 'linked_invoice_ids']
for col in standing_cols:
    status = 'EXISTS' if col in cols else 'MISSING'
    print(f"  {col:25} {status}")

# 8. Check supplier_tokens for short_code
print('\n=== SUPPLIER_TOKENS SHORT_CODE COLUMN ===')
cursor.execute('DESCRIBE supplier_tokens')
cols = [row['Field'] for row in cursor.fetchall()]
status = 'EXISTS' if 'short_code' in cols else 'MISSING'
print(f"  short_code: {status}")

# 9. Check offers for batch_id
print('\n=== OFFERS BATCH_ID COLUMN ===')
cursor.execute('DESCRIBE offers')
cols = [row['Field'] for row in cursor.fetchall()]
status = 'EXISTS' if 'batch_id' in cols else 'MISSING'
print(f"  batch_id: {status}")

# 10. What columns are MISSING from buyers for full onboarding?
print('\n=== BUYER ONBOARDING - MISSING COLUMNS ===')
cursor.execute('DESCRIBE buyers')
existing_cols = [row['Field'] for row in cursor.fetchall()]
required_cols = [
    'trading_name', 'registration_no', 'tax_id', 'industry_sector', 'risk_tier',
    'physical_address_street', 'physical_address_city', 'physical_address_province', 'physical_address_postal',
    'primary_contact_name', 'financial_contact_name', 'financial_contact_email',
    'min_invoice_amount', 'max_invoice_amount', 'min_days_to_maturity', 'max_days_to_maturity',
    'credit_limit', 'current_exposure', 'rate_card_id', 'created_by', 'approved_by', 'approved_at'
]
for col in required_cols:
    status = 'EXISTS' if col in existing_cols else 'MISSING'
    print(f"  {col:30} {status}")

# 11. Check users table for first-login columns
print('\n=== USERS - FIRST LOGIN COLUMNS ===')
cursor.execute('DESCRIBE users')
existing_cols = [row['Field'] for row in cursor.fetchall()]
first_login_cols = ['must_change_password', 'is_email_verified', 'activation_token', 'activation_expires_at']
for col in first_login_cols:
    status = 'EXISTS' if col in existing_cols else 'MISSING'
    print(f"  {col:30} {status}")

# 12. Check if rate_cards and buyer_documents tables exist
print('\n=== BUYER ONBOARDING - MISSING TABLES ===')
onboarding_tables = ['rate_cards', 'buyer_documents']
for table in onboarding_tables:
    cursor.execute(f"SHOW TABLES LIKE '{table}'")
    exists = cursor.fetchone()
    status = 'EXISTS' if exists else 'MISSING'
    print(f"  {table:25} {status}")

cursor.close()
conn.close()

print('\n' + '='*60)
print('ANALYSIS COMPLETE')
print('='*60)
