"""
Monitor database for new supplier and token creation.
Run this BEFORE uploading vendor data, then check results after upload.
"""
import mysql.connector
from datetime import datetime

DB_HOST = 'futurefinancecashflow.mysql.database.azure.com'
DB_USER = 'FMadmin'
DB_PASSWORD = 'REDACTED_DB_PASSWORD'
DB_NAME = 'fmf_scf_platform'

def check_for_test_vendor():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        ssl_disabled=False,
        ssl_verify_cert=False,
        ssl_verify_identity=False
    )
    cursor = conn.cursor(dictionary=True)
    
    print(f"\n{'='*60}")
    print(f"DATABASE CHECK - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    # Check for the test vendor
    cursor.execute("""
        SELECT supplier_id, vendor_number, name, contact_email, created_at 
        FROM suppliers 
        WHERE vendor_number = 'TEST-V004'
    """)
    supplier = cursor.fetchone()
    
    if supplier:
        print(f"\n✅ TEST-V004 FOUND!")
        print(f"   Supplier ID: {supplier['supplier_id']}")
        print(f"   Name: {supplier['name']}")
        print(f"   Email: {supplier['contact_email']}")
        print(f"   Created: {supplier['created_at']}")
        
        # Check for token
        cursor.execute("""
            SELECT token_id, token, token_type, expires_at, created_at, used_at
            FROM supplier_tokens 
            WHERE supplier_id = %s
            ORDER BY created_at DESC
        """, (supplier['supplier_id'],))
        tokens = cursor.fetchall()
        
        if tokens:
            print(f"\n📝 TOKENS FOUND: {len(tokens)}")
            for t in tokens:
                print(f"   Token ID: {t['token_id']}")
                print(f"   Token: {t['token'][:30]}...")
                print(f"   Type: {t['token_type']}")
                print(f"   Created: {t['created_at']}")
                print(f"   Expires: {t['expires_at']}")
                print(f"   Used: {t['used_at'] or 'Not used'}")
                print(f"   Access URL: https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net/supplier/access?token={t['token']}")
                print()
        else:
            print(f"\n❌ NO TOKENS FOUND for this supplier!")
            print("   This means the application did NOT auto-generate a token.")
    else:
        print(f"\n⏳ TEST-V004 not found yet.")
        print("   Upload the vendor data CSV file first, then run this script again.")
    
    # Show total counts
    cursor.execute("SELECT COUNT(*) as cnt FROM suppliers")
    total_suppliers = cursor.fetchone()['cnt']
    
    cursor.execute("SELECT COUNT(*) as cnt FROM supplier_tokens")
    total_tokens = cursor.fetchone()['cnt']
    
    print(f"\n📊 TOTALS:")
    print(f"   Total Suppliers: {total_suppliers}")
    print(f"   Total Tokens: {total_tokens}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_for_test_vendor()
