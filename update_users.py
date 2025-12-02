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

# Update users with missing full_name
cursor.execute("UPDATE users SET full_name = 'Admin User' WHERE user_id = 5")
cursor.execute("UPDATE users SET full_name = 'Buyer User' WHERE user_id = 6")
conn.commit()
print('Updated full_name for users 5 and 6')

# Verify
print('\n=== UPDATED USERS TABLE ===')
cursor.execute('SELECT user_id, username, full_name FROM users')
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
