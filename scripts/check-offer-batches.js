const mysql = require('mysql2/promise');

async function testQuery() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== TESTING THE EXACT QUERY THAT FAILS ===\n');

  try {
    // Test getEligibleInvoicesForBatching query
    console.log('Testing getEligibleInvoicesForBatching query...');
    const [invoices] = await conn.execute(`
      SELECT 
        i.invoice_id, i.invoice_number, i.amount, i.due_date, i.company_code,
        s.supplier_id, s.name as supplier_name, s.contact_email as supplier_email,
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
    console.log('SUCCESS! Found', invoices.length, 'eligible invoices');
    if (invoices.length > 0) console.table(invoices.slice(0, 3));
  } catch (err) {
    console.log('ERROR in getEligibleInvoicesForBatching:', err.message);
  }

  try {
    // Test getOfferBatches query
    console.log('\nTesting getOfferBatches query...');
    const [batches] = await conn.execute(`
      SELECT 
        ob.*,
        s.name as supplier_name, s.contact_email as supplier_email,
        b.name as buyer_name
      FROM offer_batches ob
      JOIN suppliers s ON ob.supplier_id = s.supplier_id
      JOIN buyers b ON ob.buyer_id = b.buyer_id
      ORDER BY ob.created_at DESC
    `);
    console.log('SUCCESS! Found', batches.length, 'batches');
  } catch (err) {
    console.log('ERROR in getOfferBatches:', err.message);
  }

  // Check buyers table
  console.log('\n=== BUYERS TABLE ===');
  const [buyers] = await conn.execute('SELECT * FROM buyers');
  console.table(buyers);

  await conn.end();
}

testQuery().catch(console.error);
