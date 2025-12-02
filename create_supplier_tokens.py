import mysql.connector
import secrets
from datetime import datetime, timedelta

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

# Get all suppliers without tokens
cursor.execute('''
    SELECT s.supplier_id, s.name, s.contact_email 
    FROM suppliers s
    LEFT JOIN supplier_tokens t ON s.supplier_id = t.supplier_id
    WHERE t.token_id IS NULL
''')
suppliers_without_tokens = cursor.fetchall()

print(f"Found {len(suppliers_without_tokens)} suppliers without tokens")

for supplier in suppliers_without_tokens:
    # Generate a secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=14)
    
    # Insert token
    cursor.execute('''
        INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at)
        VALUES (%s, %s, 'invite', %s)
    ''', (supplier['supplier_id'], token, expires_at))
    
    print(f"\nCreated token for: {supplier['name']} ({supplier['contact_email']})")
    print(f"Token: {token}")
    print(f"Access URL: https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net/supplier/access?token={token}")
    print(f"Expires: {expires_at}")

conn.commit()
print("\n✅ All tokens created successfully!")

cursor.close()
conn.close()
