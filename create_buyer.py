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

# --- Update passwords for all seeded AP users ---
SEED_AP_USERS = [
    {"username": "aap_ap", "email": "ap@angloplat.com", "full_name": "Anglo AP User"},
    {"username": "ssw_ap", "email": "ap@sibanyestillwater.com", "full_name": "Sibanye AP User"},
    {"username": "hgm_ap", "email": "ap@harmony.co.za", "full_name": "Harmony AP User"},
]
NEW_PASSWORD = "Transport@2025"  # Change as needed

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
    for ap_user in SEED_AP_USERS:
        hashed = bcrypt.hashpw(NEW_PASSWORD.encode(), bcrypt.gensalt()).decode()
        cursor.execute("SELECT user_id FROM users WHERE username = %s", (ap_user["username"],))
        user_result = cursor.fetchone()
        if user_result:
            cursor.execute("UPDATE users SET password_hash = %s WHERE user_id = %s", (hashed, user_result[0]))
            print(f"Password updated for AP user: {ap_user['username']}")
        else:
            print(f"AP user not found: {ap_user['username']}")
    conn.commit()
except Exception as e:
    print(f"Error updating AP user passwords: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
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

BUYER_CODE = "AAP001"  # Change to match a buyer code in your DB
AP_USERNAME = "aap_ap"
AP_EMAIL = "ap@angloplat.com"
AP_PASSWORD = "Transport@2025"  # Change as needed
AP_FULL_NAME = "Anglo AP User1"

# Hash the password
hashed = bcrypt.hashpw(AP_PASSWORD.encode(), bcrypt.gensalt()).decode()

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
    # Get buyer_id from buyers table
    cursor.execute("SELECT buyer_id FROM buyers WHERE code = %s", (BUYER_CODE,))
    result = cursor.fetchone()
    if not result:
        raise Exception(f"No buyer found with code {BUYER_CODE}")
    buyer_id = result[0]
    # Check if AP user exists
    cursor.execute("SELECT user_id FROM users WHERE username = %s", (AP_USERNAME,))
    user_result = cursor.fetchone()
    if user_result:
        # Update password
        cursor.execute("UPDATE users SET password_hash = %s WHERE user_id = %s", (hashed, user_result[0]))
        print("Buyer AP user password updated.")
    else:
        # Insert AP user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, buyer_id, full_name, active_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (AP_USERNAME, AP_EMAIL, hashed, "accounts_payable", buyer_id, AP_FULL_NAME, "active"))
        print("Buyer AP user created successfully.")
    conn.commit()
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
