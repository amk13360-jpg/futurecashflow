import os
import bcrypt
import mysql.connector
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
DB_PASSWORD = "Mining@2025"
DB_USER = "Futuremining2025"
DB_HOST = "dbfuture.mysql.database.azure.com"
DB_NAME = "fmf_scf_platform"

ADMIN_USERNAME = "admin2"
ADMIN_EMAIL = "admin2@example.com"
ADMIN_PASSWORD = "Transport@2025"  # Change as needed

# Buyer credentials
BUYER_USERNAME = "buyer1"
BUYER_EMAIL = "buyer1@example.com"
BUYER_PASSWORD = "Transport@2025"  # Change as needed

# Hash passwords
admin_hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
buyer_hashed = bcrypt.hashpw(BUYER_PASSWORD.encode(), bcrypt.gensalt()).decode()

try:
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        ssl_disabled=False,
        ssl_verify_cert=False,
        ssl_verify_identity=False
    )
    cursor = conn.cursor()
    # Create admin user
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, role)
        VALUES (%s, %s, %s, %s)
    """, (ADMIN_USERNAME, ADMIN_EMAIL, admin_hashed, "admin"))
    print("Admin user created successfully.")

    # Create buyer user
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, role)
        VALUES (%s, %s, %s, %s)
    """, (BUYER_USERNAME, BUYER_EMAIL, buyer_hashed, "accounts_payable"))
    print("Buyer user created successfully.")

    conn.commit()
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
