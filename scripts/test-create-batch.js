const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });
  
  console.log('=== SIMULATING CREATE BATCH FOR MOKWENA (supplier_id=89) ===\n');
  
  // 1. Check system settings
  const [settings] = await conn.execute(
    `SELECT setting_key, setting_value FROM system_settings 
     WHERE setting_key IN ('default_annual_rate', 'offer_expiry_days')`
  );
  console.log('1) System settings:');
  console.table(settings);
  
  // 2. Verify supplier
  const [suppliers] = await conn.execute(
    `SELECT s.supplier_id, s.name, s.contact_email, s.company_code, b.buyer_id, b.name as buyer_name 
     FROM suppliers s 
     JOIN buyers b ON b.code = s.company_code 
     WHERE s.supplier_id = 89 AND s.onboarding_status = 'approved'`
  );
  console.log('\n2) Supplier verification:');
  console.table(suppliers);
  
  // 3. Check invoice 115 (INV-MSF-2025-002)
  const [invoice] = await conn.execute(
    `SELECT i.invoice_id, i.invoice_number, i.status, i.amount, i.vendor_number, i.company_code, s.supplier_id 
     FROM invoices i 
     JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code 
     WHERE i.invoice_id = 115 AND i.status = 'matched' AND s.supplier_id = 89`
  );
  console.log('\n3) Invoice check (ID 115 for supplier 89):');
  
  if (invoice.length === 0) {
    console.log('ERROR: Invoice 115 not found with matched status for supplier 89!');
    
    // Debug further
    const [invoiceRaw] = await conn.execute(
      'SELECT invoice_id, invoice_number, status, vendor_number, company_code FROM invoices WHERE invoice_id = 115'
    );
    console.log('\nRaw invoice data:');
    console.table(invoiceRaw);
    
    const [supplierVendor] = await conn.execute(
      'SELECT supplier_id, name, vendor_number, company_code FROM suppliers WHERE supplier_id = 89'
    );
    console.log('\nSupplier vendor info:');
    console.table(supplierVendor);
    
    // Check if vendor numbers match
    if (invoiceRaw.length > 0 && supplierVendor.length > 0) {
      const invVendor = invoiceRaw[0].vendor_number;
      const supVendor = supplierVendor[0].vendor_number;
      console.log(`\nVendor number comparison: Invoice=${invVendor}, Supplier=${supVendor}, Match=${invVendor === supVendor}`);
    }
  } else {
    console.table(invoice);
  }
  
  // 4. Check if offer already exists for this invoice
  console.log('\n4) Existing offers for invoice 115:');
  const [existingOffers] = await conn.execute(
    'SELECT offer_id, invoice_id, supplier_id, status FROM offers WHERE invoice_id = 115'
  );
  if (existingOffers.length === 0) {
    console.log('No existing offers for invoice 115');
  } else {
    console.table(existingOffers);
  }
  
  // 5. Check current offer_batches count
  console.log('\n5) Current offer_batches:');
  const [batches] = await conn.execute('SELECT * FROM offer_batches');
  if (batches.length === 0) {
    console.log('No offer batches exist');
  } else {
    console.table(batches);
  }
  
  await conn.end();
}

test().catch(console.error);
