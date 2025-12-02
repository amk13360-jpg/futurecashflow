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

# Emails to use
emails = [
    'bradleyswear@gmail.com',
    'swelucas121@gmail.com', 
    'swelihlemaphumulo239@gmail.com'
]

# Create 3 new vendors with the provided emails
vendors_data = [
    {
        'vendor_number': 'VND-001',
        'name': 'Bradley Mining Supplies (Pty) Ltd',
        'contact_person': 'Bradley Swear',
        'contact_email': 'bradleyswear@gmail.com',
        'contact_phone': '+27 82 123 4567',
        'address': '123 Mining Road, Johannesburg, Gauteng, 2001',
        'bank_name': 'Standard Bank',
        'bank_account_no': '123456789',
        'bank_branch_code': '051001',
        'vat_no': '4123456001',
        'registration_no': '2024/123456/07',
        'company_code': '1000'
    },
    {
        'vendor_number': 'VND-002',
        'name': 'Lucas Equipment Rentals CC',
        'contact_person': 'Swelihle Lucas',
        'contact_email': 'swelucas121@gmail.com',
        'contact_phone': '+27 83 987 6543',
        'address': '456 Industrial Park, Rustenburg, North West, 0300',
        'bank_name': 'FNB',
        'bank_account_no': '987654321',
        'bank_branch_code': '250655',
        'vat_no': '4123456002',
        'registration_no': '2023/987654/23',
        'company_code': '1000'
    },
    {
        'vendor_number': 'VND-003',
        'name': 'Maphumulo Construction Services',
        'contact_person': 'Swelihle Maphumulo',
        'contact_email': 'swelihlemaphumulo239@gmail.com',
        'contact_phone': '+27 84 555 1234',
        'address': '789 Building Street, Pretoria, Gauteng, 0001',
        'bank_name': 'Nedbank',
        'bank_account_no': '555666777',
        'bank_branch_code': '198765',
        'vat_no': '4123456003',
        'registration_no': '2022/555666/07',
        'company_code': '1000'
    }
]

print("=== INSERTING VENDORS ===")
supplier_ids = []

for vendor in vendors_data:
    # Check if vendor already exists
    cursor.execute("SELECT supplier_id FROM suppliers WHERE vendor_number = %s", (vendor['vendor_number'],))
    existing = cursor.fetchone()
    
    if existing:
        print(f"Vendor {vendor['vendor_number']} already exists with ID {existing['supplier_id']}")
        supplier_ids.append(existing['supplier_id'])
    else:
        cursor.execute("""
            INSERT INTO suppliers (
                vendor_number, name, contact_person, contact_email, contact_phone,
                address, bank_name, bank_account_no, bank_branch_code, 
                vat_no, registration_no, company_code, 
                onboarding_status, active_status, risk_tier
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'approved', 'active', 'low'
            )
        """, (
            vendor['vendor_number'], vendor['name'], vendor['contact_person'],
            vendor['contact_email'], vendor['contact_phone'], vendor['address'],
            vendor['bank_name'], vendor['bank_account_no'], vendor['bank_branch_code'],
            vendor['vat_no'], vendor['registration_no'], vendor['company_code']
        ))
        supplier_id = cursor.lastrowid
        supplier_ids.append(supplier_id)
        print(f"Created vendor: {vendor['name']} (ID: {supplier_id})")
        
        # Create token for the supplier
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=14)
        cursor.execute("""
            INSERT INTO supplier_tokens (supplier_id, token, token_type, expires_at)
            VALUES (%s, %s, 'invite', %s)
        """, (supplier_id, token, expires_at))
        print(f"  Created invite token for {vendor['name']}")

conn.commit()

# Create invoices for each vendor
print("\n=== INSERTING INVOICES ===")

# Get buyer_id (Anglo American Platinum - buyer_id 1)
buyer_id = 1

invoice_data = [
    # Invoices for Bradley Mining Supplies
    {'vendor_idx': 0, 'invoice_number': 'INV-2024-001', 'amount': 125000.00, 'days_offset': 30, 'desc': 'Mining drill bits and accessories'},
    {'vendor_idx': 0, 'invoice_number': 'INV-2024-002', 'amount': 87500.50, 'days_offset': 45, 'desc': 'Safety equipment and PPE'},
    {'vendor_idx': 0, 'invoice_number': 'INV-2024-003', 'amount': 250000.00, 'days_offset': 60, 'desc': 'Heavy machinery parts'},
    
    # Invoices for Lucas Equipment Rentals
    {'vendor_idx': 1, 'invoice_number': 'INV-2024-004', 'amount': 450000.00, 'days_offset': 30, 'desc': 'Excavator rental - 3 months'},
    {'vendor_idx': 1, 'invoice_number': 'INV-2024-005', 'amount': 175000.00, 'days_offset': 45, 'desc': 'Dump truck rental - 1 month'},
    {'vendor_idx': 1, 'invoice_number': 'INV-2024-006', 'amount': 95000.00, 'days_offset': 60, 'desc': 'Generator rental and maintenance'},
    
    # Invoices for Maphumulo Construction
    {'vendor_idx': 2, 'invoice_number': 'INV-2024-007', 'amount': 780000.00, 'days_offset': 30, 'desc': 'Road construction phase 1'},
    {'vendor_idx': 2, 'invoice_number': 'INV-2024-008', 'amount': 320000.00, 'days_offset': 45, 'desc': 'Building renovation works'},
    {'vendor_idx': 2, 'invoice_number': 'INV-2024-009', 'amount': 150000.00, 'days_offset': 60, 'desc': 'Site preparation and clearing'},
]

today = datetime.now().date()

for inv in invoice_data:
    supplier_id = supplier_ids[inv['vendor_idx']]
    vendor_number = vendors_data[inv['vendor_idx']]['vendor_number']
    invoice_date = today - timedelta(days=10)
    due_date = today + timedelta(days=inv['days_offset'])
    
    # Check if invoice already exists
    cursor.execute("SELECT invoice_id FROM invoices WHERE invoice_number = %s AND buyer_id = %s", 
                   (inv['invoice_number'], buyer_id))
    existing = cursor.fetchone()
    
    if existing:
        print(f"Invoice {inv['invoice_number']} already exists")
    else:
        cursor.execute("""
            INSERT INTO invoices (
                buyer_id, supplier_id, invoice_number, invoice_date, due_date,
                amount, currency, description, status, vendor_number, document_number,
                document_type, document_date, posting_date, baseline_date, net_due_date,
                amount_doc_curr, amount_local_curr, company_code
            ) VALUES (
                %s, %s, %s, %s, %s, %s, 'ZAR', %s, 'pending', %s, %s,
                'KR', %s, %s, %s, %s, %s, %s, '1000'
            )
        """, (
            buyer_id, supplier_id, inv['invoice_number'], invoice_date, due_date,
            inv['amount'], inv['desc'], vendor_number, inv['invoice_number'],
            invoice_date, invoice_date, invoice_date, due_date,
            inv['amount'], inv['amount']
        ))
        print(f"Created invoice: {inv['invoice_number']} - R {inv['amount']:,.2f} for {vendors_data[inv['vendor_idx']]['name']}")

conn.commit()

# Verify the data
print("\n=== VERIFICATION ===")
print("\nNew Vendors:")
cursor.execute("""
    SELECT supplier_id, vendor_number, name, contact_email, onboarding_status 
    FROM suppliers 
    WHERE contact_email IN (%s, %s, %s)
""", tuple(emails))
for row in cursor.fetchall():
    print(f"  {row}")

print("\nNew Invoices:")
cursor.execute("""
    SELECT i.invoice_number, i.amount, i.status, s.name as supplier_name
    FROM invoices i
    JOIN suppliers s ON i.supplier_id = s.supplier_id
    WHERE s.contact_email IN (%s, %s, %s)
    ORDER BY i.invoice_id DESC
""", tuple(emails))
for row in cursor.fetchall():
    print(f"  {row['invoice_number']}: R {row['amount']:,.2f} - {row['supplier_name']} ({row['status']})")

print("\n=== SUMMARY ===")
cursor.execute("SELECT COUNT(*) as total FROM suppliers")
print(f"Total Suppliers: {cursor.fetchone()['total']}")

cursor.execute("SELECT COUNT(*) as total FROM invoices")
print(f"Total Invoices: {cursor.fetchone()['total']}")

cursor.execute("SELECT SUM(amount) as total FROM invoices")
result = cursor.fetchone()
print(f"Total Invoice Value: R {result['total']:,.2f}" if result['total'] else "Total Invoice Value: R 0.00")

cursor.close()
conn.close()

print("\n✅ Data insertion complete!")
