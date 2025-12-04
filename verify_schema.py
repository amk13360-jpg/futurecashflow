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

print('=== UPDATED BUYERS TABLE STRUCTURE ===')
cursor.execute('DESCRIBE buyers')
for row in cursor.fetchall():
    print(f"  {row['Field']:30} {row['Type'][:35]:35}")

print('\n=== NEW TABLES ===')
for table in ['rate_cards', 'buyer_documents', 'buyer_change_log']:
    cursor.execute(f'SELECT COUNT(*) as cnt FROM {table}')
    cnt = cursor.fetchone()['cnt']
    print(f'  {table}: {cnt} rows')

print('\n=== RATE CARDS DATA ===')
cursor.execute('SELECT * FROM rate_cards')
for row in cursor.fetchall():
    print(row)

print('\n=== USERS TABLE - NEW COLUMNS ===')
cursor.execute('DESCRIBE users')
for row in cursor.fetchall():
    if row['Field'] in ['must_change_password', 'is_email_verified', 'activation_token', 'activation_expires_at']:
        print(f"  {row['Field']:30} {row['Type'][:30]}")

print('\n=== ALL TABLES COUNT ===')
cursor.execute('SHOW TABLES')
tables = cursor.fetchall()
for row in tables:
    table_name = list(row.values())[0]
    cursor.execute(f'SELECT COUNT(*) as cnt FROM `{table_name}`')
    count = cursor.fetchone()['cnt']
    print(f"  {table_name:30} {count} rows")

cursor.close()
conn.close()
