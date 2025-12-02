"""
Simulate vendor data import to test token generation and email sending.
This mimics what happens when a user uploads vendor CSV data via the AP portal.
"""
import mysql.connector
import secrets
from datetime import datetime, timedelta
import os

# Azure Communication Services imports
from azure.communication.email import EmailClient

# Database connection
DB_HOST = 'futurefinancecashflow.mysql.database.azure.com'
DB_USER = 'FMadmin'
DB_PASSWORD = 'REDACTED_DB_PASSWORD'
DB_NAME = 'fmf_scf_platform'

# Azure Communication Services
ACS_CONNECTION_STRING = "endpoint=https://fm-acs-dev-san.africa.communication.azure.com/;accesskey=REDACTED_ACS_KEY"
ACS_SENDER = "DoNotReply@56279b88-458b-44e2-9d6c-9f867fcdf491.azurecomm.net"

# Test vendor data - using unique values for testing
TEST_VENDOR = {
    "Company Code": "FMF001",
    "Vendor Number": "TEST-V003",
    "Vendor Name": "Test Vendor - Swelihle",
    "Address": "123 Test Street, Johannesburg",
    "Contact Person": "Swelihle Lucas",
    "Contact Email": "swelihlelucas@gmail.com",
    "Contact Phone": "+27 11 123 4567",
    "Bank Country": "ZA",
    "Bank Name": "Standard Bank",
    "Bank Key (Branch Code)": "051001",
    "Bank Account Number": "123456789",
    "IBAN": None,
    "SWIFT/BIC": "SBZAZAJJ",
    "Default Payment Method": "EFT",
    "Default Payment Terms": "30 days",
    "VAT Registration No": "4999888777",
    "Reconciliation G/L Account": None
}

BASE_URL = "https://fm-asp-dev-san-hufee4h8hyawbhcx.southafricanorth-01.azurewebsites.net"


def send_welcome_email(recipient_email: str, supplier_name: str, access_link: str) -> bool:
    """Send welcome email via Azure Communication Services"""
    try:
        print(f"\n📧 Sending welcome email to {recipient_email}...")
        
        email_client = EmailClient.from_connection_string(ACS_CONNECTION_STRING)
        
        message = {
            "senderAddress": ACS_SENDER,
            "recipients": {
                "to": [{"address": recipient_email, "displayName": supplier_name}]
            },
            "content": {
                "subject": "Welcome to Future Cashflow Platform",
                "plainText": f"""
Hello {supplier_name},

Welcome to the Future Cashflow Platform!

You have been onboarded as a supplier. Please use the following link to access your dashboard:

{access_link}

This link will expire in 14 days.

Best regards,
Future Cashflow Team
                """.strip(),
                "html": f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
    .header h1 {{ color: white; margin: 0; font-size: 24px; }}
    .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
    .button {{ display: inline-block; padding: 15px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
    .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }}
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Future Cashflow</h1>
  </div>
  <div class="content">
    <h2>Hello {supplier_name},</h2>
    <p>Welcome to the <strong>Future Cashflow Platform</strong>!</p>
    <p>You have been successfully onboarded as a supplier. You can now access your dashboard to view offers and manage your account.</p>
    <div style="text-align: center;">
      <a href="{access_link}" class="button">Access Dashboard</a>
    </div>
    <p><strong>Link expires in 14 days.</strong></p>
    <p>If you have any questions, please contact your account manager.</p>
    <p>Best regards,<br><strong>Future Cashflow Team</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© 2025 Future Cashflow. All rights reserved.</p>
  </div>
</body>
</html>
                """.strip()
            }
        }
        
        poller = email_client.begin_send(message)
        result = poller.result()
        
        print(f"   Email send status: {result['status']}")
        
        if result['status'] == 'Succeeded':
            print(f"   ✅ Email sent successfully to {recipient_email}")
            return True
        else:
            print(f"   ❌ Email failed with status: {result['status']}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error sending email: {e}")
        return False


def simulate_vendor_import():
    """Simulate the vendor import process"""
    print("=" * 60)
    print("SIMULATING VENDOR DATA IMPORT")
    print("=" * 60)
    
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
    
    try:
        # Step 1: Check if vendor already exists
        print(f"\n1️⃣ Checking if vendor exists...")
        cursor.execute(
            "SELECT supplier_id FROM suppliers WHERE vendor_number = %s AND company_code = %s",
            (TEST_VENDOR["Vendor Number"], TEST_VENDOR["Company Code"])
        )
        existing = cursor.fetchone()
        
        supplier_id = None
        is_new = False
        
        if existing:
            print(f"   Vendor already exists with ID: {existing['supplier_id']}")
            supplier_id = existing['supplier_id']
            # Update existing supplier
            cursor.execute("""
                UPDATE suppliers SET
                    name = %s, address = %s, contact_person = %s, contact_email = %s, contact_phone = %s,
                    bank_country = %s, bank_name = %s, bank_key_branch_code = %s, bank_account_no = %s,
                    swift_bic = %s, default_payment_method = %s, default_payment_terms = %s, vat_no = %s
                WHERE supplier_id = %s
            """, (
                TEST_VENDOR["Vendor Name"], TEST_VENDOR["Address"], TEST_VENDOR["Contact Person"],
                TEST_VENDOR["Contact Email"], TEST_VENDOR["Contact Phone"], TEST_VENDOR["Bank Country"],
                TEST_VENDOR["Bank Name"], TEST_VENDOR["Bank Key (Branch Code)"], TEST_VENDOR["Bank Account Number"],
                TEST_VENDOR["SWIFT/BIC"], TEST_VENDOR["Default Payment Method"], TEST_VENDOR["Default Payment Terms"],
                TEST_VENDOR["VAT Registration No"], supplier_id
            ))
            print(f"   ✅ Updated existing supplier")
        else:
            # Insert new supplier
            print(f"   Creating NEW supplier...")
            cursor.execute("""
                INSERT INTO suppliers (
                    vendor_number, company_code, name, address, contact_person, contact_email, contact_phone,
                    bank_country, bank_name, bank_key_branch_code, bank_account_no, swift_bic,
                    default_payment_method, default_payment_terms, vat_no,
                    onboarding_status, active_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', 'active')
            """, (
                TEST_VENDOR["Vendor Number"], TEST_VENDOR["Company Code"], TEST_VENDOR["Vendor Name"],
                TEST_VENDOR["Address"], TEST_VENDOR["Contact Person"], TEST_VENDOR["Contact Email"],
                TEST_VENDOR["Contact Phone"], TEST_VENDOR["Bank Country"], TEST_VENDOR["Bank Name"],
                TEST_VENDOR["Bank Key (Branch Code)"], TEST_VENDOR["Bank Account Number"], TEST_VENDOR["SWIFT/BIC"],
                TEST_VENDOR["Default Payment Method"], TEST_VENDOR["Default Payment Terms"],
                TEST_VENDOR["VAT Registration No"]
            ))
            supplier_id = cursor.lastrowid
            is_new = True
            print(f"   ✅ Created NEW supplier with ID: {supplier_id}")
        
        conn.commit()
        
        # Step 2: Check for existing active tokens
        print(f"\n2️⃣ Checking for existing active tokens...")
        cursor.execute("""
            SELECT token_id, token FROM supplier_tokens 
            WHERE supplier_id = %s AND token_type = 'invite' AND used_at IS NULL AND expires_at > NOW()
        """, (supplier_id,))
        existing_token = cursor.fetchone()
        
        if existing_token:
            print(f"   ⚠️ Supplier already has an active token")
            print(f"   Existing token: {existing_token['token'][:20]}...")
            # Delete existing token to create a fresh one for testing
            print(f"   Deleting existing token for fresh test...")
            cursor.execute("DELETE FROM supplier_tokens WHERE token_id = %s", (existing_token['token_id'],))
            conn.commit()
        
        # Step 3: Generate new token
        print(f"\n3️⃣ Generating new invite token...")
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=14)
        
        cursor.execute("""
            INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at)
            VALUES (%s, %s, 'invite', %s)
        """, (supplier_id, token, expires_at))
        conn.commit()
        
        print(f"   ✅ Token generated: {token}")
        print(f"   Expires: {expires_at}")
        
        # Step 4: Generate access link
        access_link = f"{BASE_URL}/supplier/access?token={token}"
        print(f"\n4️⃣ Access link generated:")
        print(f"   {access_link}")
        
        # Step 5: Send welcome email
        print(f"\n5️⃣ Sending welcome email via Azure Communication Services...")
        email_sent = send_welcome_email(
            TEST_VENDOR["Contact Email"],
            TEST_VENDOR["Vendor Name"],
            access_link
        )
        
        # Summary
        print("\n" + "=" * 60)
        print("IMPORT SIMULATION COMPLETE")
        print("=" * 60)
        print(f"Supplier ID: {supplier_id}")
        print(f"Vendor Number: {TEST_VENDOR['Vendor Number']}")
        print(f"Vendor Name: {TEST_VENDOR['Vendor Name']}")
        print(f"Contact Email: {TEST_VENDOR['Contact Email']}")
        print(f"Token: {token}")
        print(f"Access URL: {access_link}")
        print(f"Email Sent: {'✅ YES' if email_sent else '❌ NO'}")
        print("=" * 60)
        
        return {
            "supplier_id": supplier_id,
            "token": token,
            "access_link": access_link,
            "email_sent": email_sent
        }
        
    except Exception as e:
        print(f"\n❌ Error during import: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    simulate_vendor_import()
