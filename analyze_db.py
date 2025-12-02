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
    print(row)

print('\n=== SUPPLIERS TABLE STRUCTURE ===')
cursor.execute('DESCRIBE suppliers')
for row in cursor.fetchall():
    print(row)

print('\n=== BUYERS ===')
cursor.execute('SELECT buyer_id, name, code FROM buyers')
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
