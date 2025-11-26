import os
import bcrypt
import mysql.connector
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
DB_PASSWORD = os.getenv("DB_PASSWORD", "REDACTED_DB_PASSWORD")
DB_USER = os.getenv("DB_USER", "FMadmin")
DB_HOST = os.getenv("DB_HOST", "futurefinancecashflow.mysql.database.azure.com")
DB_NAME = os.getenv("DB_NAME", "fmf_scf_platform")

ADMIN_USERNAME = "admin01"
ADMIN_EMAIL = "admin01@futureming.com"
ADMIN_PASSWORD = "Mining@2025"  # Change as needed

# Buyer credentials
BUYER_USERNAME = "buyer01"
BUYER_EMAIL = "buyer1@gmail.com"
BUYER_PASSWORD = "buyer01@2025"  # Change as needed

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
