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

print('=== INVOICES TABLE STRUCTURE ===')
cursor.execute('DESCRIBE invoices')
for row in cursor.fetchall():
    print(f"{row['Field']:30} {row['Type']:30} {row['Null']:5} {row['Key']}")

print('\n=== SUPPLIERS FOR APP2025 ===')
cursor.execute('SELECT supplier_id, vendor_number, company_code, name, contact_email FROM suppliers WHERE company_code = %s', ('APP2025',))
suppliers = cursor.fetchall()
if suppliers:
    for row in suppliers:
        print(row)
else:
    print('NO SUPPLIERS FOUND for APP2025')

print('\n=== INVOICES FOR APP2025 ===')
cursor.execute('SELECT invoice_id, company_code, vendor_number, invoice_number, amount, currency FROM invoices WHERE company_code = %s LIMIT 10', ('APP2025',))
invoices = cursor.fetchall()
if invoices:
    for row in invoices:
        print(row)
else:
    print('NO INVOICES FOUND for APP2025')

print('\n=== BUYER APP2025 ===')
cursor.execute('SELECT buyer_id, name, code, active_status FROM buyers WHERE code = %s', ('APP2025',))
for row in cursor.fetchall():
    print(row)

print('\n=== ALL SUPPLIERS (first 10) ===')
cursor.execute('SELECT supplier_id, vendor_number, company_code, name FROM suppliers LIMIT 10')
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
