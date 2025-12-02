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

print('=== EXISTING SUPPLIERS ===')
cursor.execute('SELECT supplier_id, vendor_number, company_code, name FROM suppliers')
for row in cursor.fetchall():
    print(f"  {row['supplier_id']}: {row['vendor_number']} ({row['company_code']}) - {row['name']}")

print()
print('=== EXISTING BUYERS ===')
cursor.execute('SELECT buyer_id, code, name FROM buyers')
for row in cursor.fetchall():
    print(f"  {row['buyer_id']}: {row['code']} - {row['name']}")

cursor.close()
conn.close()
