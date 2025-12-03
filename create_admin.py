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

# Hash password
admin_hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()

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
    
    # Update admin user password
    cursor.execute("""
        UPDATE users 
        SET password_hash = %s, updated_at = NOW()
        WHERE username = %s
    """, (admin_hashed, ADMIN_USERNAME))
    
    if cursor.rowcount > 0:
        print(f"Admin user '{ADMIN_USERNAME}' password updated successfully.")
    else:
        # Create admin user if doesn't exist
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """, (ADMIN_USERNAME, ADMIN_EMAIL, admin_hashed, "admin"))
        print(f"Admin user '{ADMIN_USERNAME}' created successfully.")

    conn.commit()
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
