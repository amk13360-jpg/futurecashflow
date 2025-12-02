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

print('=== SUPPLIERS TABLE (Last 20) ===')
cursor.execute('SELECT supplier_id, vendor_number, name, contact_email, onboarding_status, created_at FROM suppliers ORDER BY supplier_id DESC LIMIT 20')
for row in cursor.fetchall():
    print(row)

print('\n=== SUPPLIER_TOKENS TABLE ===')
cursor.execute('SELECT * FROM supplier_tokens ORDER BY token_id DESC LIMIT 20')
tokens = cursor.fetchall()
if tokens:
    for row in tokens:
        print(row)
else:
    print('NO TOKENS FOUND!')

print('\n=== COUNT SUMMARY ===')
cursor.execute('SELECT COUNT(*) as total_suppliers FROM suppliers')
result = cursor.fetchone()
print(f"Total Suppliers: {result['total_suppliers']}")

cursor.execute('SELECT COUNT(*) as total_tokens FROM supplier_tokens')
result = cursor.fetchone()
print(f"Total Tokens: {result['total_tokens']}")

# Check which suppliers don't have tokens
print('\n=== SUPPLIERS WITHOUT TOKENS ===')
cursor.execute('''
    SELECT s.supplier_id, s.vendor_number, s.name, s.contact_email, s.created_at 
    FROM suppliers s
    LEFT JOIN supplier_tokens t ON s.supplier_id = t.supplier_id
    WHERE t.token_id IS NULL
    ORDER BY s.supplier_id DESC
    LIMIT 20
''')
no_token_suppliers = cursor.fetchall()
if no_token_suppliers:
    for row in no_token_suppliers:
        print(row)
else:
    print('All suppliers have tokens!')

cursor.close()
conn.close()
