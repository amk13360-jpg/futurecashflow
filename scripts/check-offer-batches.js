const mysql = require('mysql2/promise');

async function checkStatus() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== CURRENT STATUS ===\n');

  // Check offer_batches
  console.log('=== OFFER BATCHES ===');
  const [batches] = await conn.execute('SELECT * FROM offer_batches');
  console.log('Count:', batches.length);
  if (batches.length > 0) console.table(batches);

  // Check eligible invoices
  console.log('\n=== ELIGIBLE FOR BATCHING ===');
  const [eligible] = await conn.execute(`
    SELECT i.invoice_id, i.invoice_number, s.supplier_id, s.name, i.status
    FROM invoices i 
    JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code 
    WHERE i.status = 'matched' 
      AND s.onboarding_status = 'approved' 
      AND i.due_date > CURDATE()
  `);
  console.table(eligible);
  console.log('Total eligible:', eligible.length);

  await conn.end();
}

checkStatus().catch(console.error);
