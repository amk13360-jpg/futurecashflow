const { getConnection } = require('./db-config');

async function analyze() {
  const conn = await getConnection();

  console.log('='.repeat(70));
  console.log('  FULL DATABASE ANALYSIS');
  console.log('='.repeat(70));

  // 1. ALL SUPPLIERS
  console.log('\n1. ALL SUPPLIERS:');
  const [suppliers] = await conn.execute(`
    SELECT supplier_id, vendor_number, company_code, name, contact_email, 
           onboarding_status, active_status
    FROM suppliers ORDER BY supplier_id
  `);
  console.table(suppliers);

  // 2. ALL BUYERS
  console.log('\n2. ALL BUYERS:');
  const [buyers] = await conn.execute(`
    SELECT buyer_id, name, code, contact_email, active_status
    FROM buyers ORDER BY buyer_id
  `);
  console.table(buyers);

  // 3. ALL INVOICES - status breakdown
  console.log('\n3. ALL INVOICES:');
  const [allInvoices] = await conn.execute(`
    SELECT i.invoice_id, i.company_code, i.vendor_number, i.invoice_number, 
           i.amount, i.currency, i.status, i.due_date,
           i.supplier_id, i.buyer_id,
           s.name as supplier_name, s.onboarding_status as supplier_status,
           b.name as buyer_name
    FROM invoices i
    LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
    LEFT JOIN buyers b ON i.buyer_id = b.buyer_id
    ORDER BY i.invoice_id
  `);
  console.table(allInvoices);

  // 4. INVOICE STATUS SUMMARY
  console.log('\n4. INVOICE STATUS SUMMARY:');
  const [statusSummary] = await conn.execute(`
    SELECT status, COUNT(*) as count, SUM(amount) as total_amount
    FROM invoices GROUP BY status
  `);
  console.table(statusSummary);

  // 5. ELIGIBLE FOR BATCHING (the exact query used by getEligibleInvoicesForBatching)
  console.log('\n5. ELIGIBLE FOR BATCHING (app query):');
  const [eligible] = await conn.execute(`
    SELECT 
      i.invoice_id, i.invoice_number, i.amount, i.due_date, i.status, i.company_code, i.vendor_number,
      s.supplier_id, s.name as supplier_name, s.contact_email, s.onboarding_status, s.vendor_number as s_vendor, s.company_code as s_company,
      b.buyer_id, b.name as buyer_name, b.code as buyer_code,
      DATEDIFF(i.due_date, CURDATE()) as days_to_maturity
    FROM invoices i
    JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
    JOIN buyers b ON b.code = i.company_code
    WHERE i.status = 'matched' 
      AND s.onboarding_status = 'approved'
      AND DATEDIFF(i.due_date, CURDATE()) > 0
    ORDER BY s.supplier_id, i.due_date
  `);
  if (eligible.length === 0) {
    console.log('>>> NO ELIGIBLE INVOICES! Checking why...');
    
    // Check matched invoices regardless of supplier status
    const [matchedAny] = await conn.execute(`
      SELECT i.invoice_id, i.invoice_number, i.status, i.vendor_number, i.company_code, i.due_date,
             DATEDIFF(i.due_date, CURDATE()) as days_to_maturity
      FROM invoices i WHERE i.status = 'matched'
    `);
    console.log('\n   5a. Invoices with status=matched:', matchedAny.length);
    if (matchedAny.length > 0) console.table(matchedAny);

    // Check if JOIN on vendor_number + company_code works
    const [joinCheck] = await conn.execute(`
      SELECT i.invoice_id, i.vendor_number as i_vendor, i.company_code as i_company,
             s.supplier_id, s.vendor_number as s_vendor, s.company_code as s_company, s.onboarding_status
      FROM invoices i
      LEFT JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
      WHERE i.status = 'matched'
    `);
    console.log('\n   5b. Match check (invoice vendor_number ↔ supplier vendor_number):');
    if (joinCheck.length > 0) console.table(joinCheck);

    // Check if supplier_id based join works (invoices may have supplier_id populated)
    const [supplierIdJoin] = await conn.execute(`
      SELECT i.invoice_id, i.invoice_number, i.supplier_id as i_supplier_id, i.vendor_number, i.company_code,
             s.supplier_id as s_supplier_id, s.name, s.onboarding_status
      FROM invoices i
      LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
      WHERE i.status = 'matched'
    `);
    console.log('\n   5c. Invoices matched by supplier_id FK:');
    if (supplierIdJoin.length > 0) console.table(supplierIdJoin);

  } else {
    console.table(eligible);
  }

  // 6. EXISTING OFFER BATCHES
  console.log('\n6. EXISTING OFFER BATCHES:');
  const [batches] = await conn.execute(`
    SELECT ob.*, s.name as supplier_name, s.contact_email
    FROM offer_batches ob
    JOIN suppliers s ON ob.supplier_id = s.supplier_id
    ORDER BY ob.created_at DESC
  `);
  if (batches.length === 0) {
    console.log('No offer batches.');
  } else {
    console.table(batches);
  }

  // 7. EXISTING OFFERS
  console.log('\n7. EXISTING OFFERS:');
  const [offers] = await conn.execute(`
    SELECT o.offer_id, o.invoice_id, o.supplier_id, o.buyer_id, o.batch_id,
           o.status, o.sent_at, o.discount_amount, o.net_payment_amount,
           i.invoice_number, i.status as invoice_status
    FROM offers o
    JOIN invoices i ON o.invoice_id = i.invoice_id
    ORDER BY o.offer_id DESC
  `);
  if (offers.length === 0) {
    console.log('No offers.');
  } else {
    console.table(offers);
  }

  // 8. OFFERS ENUM CHECK
  console.log('\n8. OFFERS TABLE STATUS ENUM:');
  const [offerCols] = await conn.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'fmf_scf_platform' AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'status'
  `);
  console.table(offerCols);

  // 9. SUPPLIER TOKENS (recent)
  console.log('\n9. RECENT SUPPLIER TOKENS (last 10):');
  const [tokens] = await conn.execute(`
    SELECT st.token_id, st.supplier_id, st.token_type, st.expires_at, st.used_at, st.short_code,
           s.name as supplier_name, s.contact_email
    FROM supplier_tokens st
    JOIN suppliers s ON st.supplier_id = s.supplier_id
    ORDER BY st.token_id DESC LIMIT 10
  `);
  console.table(tokens);

  // 10. SYSTEM_SETTINGS
  console.log('\n10. SYSTEM SETTINGS:');
  const [sysSettings] = await conn.execute(`SELECT * FROM system_settings`);
  if (sysSettings.length === 0) {
    console.log('No system settings found!');
  } else {
    console.table(sysSettings);
  }

  // 11. Check for duplicate emails across suppliers
  console.log('\n11. DUPLICATE EMAILS ACROSS SUPPLIERS:');
  const [dupeEmails] = await conn.execute(`
    SELECT contact_email, COUNT(*) as count, GROUP_CONCAT(supplier_id) as supplier_ids, GROUP_CONCAT(name SEPARATOR ' | ') as names
    FROM suppliers
    GROUP BY contact_email HAVING COUNT(*) > 1
  `);
  if (dupeEmails.length === 0) {
    console.log('No duplicate emails.');
  } else {
    console.log('>>> DUPLICATE EMAILS FOUND:');
    console.table(dupeEmails);
  }

  // SUMMARY
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  
  const [supplierCount] = await conn.execute(`SELECT COUNT(*) as total, SUM(onboarding_status='approved') as approved FROM suppliers`);
  const [invoiceCount] = await conn.execute(`SELECT COUNT(*) as total, SUM(status='matched') as matched, SUM(status='offered') as offered FROM invoices`);
  const [offerCount] = await conn.execute(`SELECT COUNT(*) as total, SUM(status='draft') as draft_status, SUM(sent_at IS NULL) as unsent FROM offers`);
  
  console.log(`Suppliers: ${supplierCount[0].total} total, ${supplierCount[0].approved} approved`);
  console.log(`Invoices:  ${invoiceCount[0].total} total, ${invoiceCount[0].matched} matched, ${invoiceCount[0].offered} offered`);
  console.log(`Offers:    ${offerCount[0].total} total, ${offerCount[0].draft_status} with 'draft' status (BUG!), ${offerCount[0].unsent} with sent_at=NULL`);
  console.log(`Batches:   ${batches.length}`);

  await conn.end();
}

analyze().catch(console.error);
