const { getConnection } = require('./db-config');

async function main() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== DATABASE ANALYSIS (Azure MySQL) ===\n');

  // Eligible invoices for batching
  console.log('1) Eligible invoices for batching (matched + approved suppliers):');
  const [eligible] = await conn.execute(
    "SELECT i.invoice_id, i.invoice_number, i.amount, i.status, s.name AS supplier, s.supplier_id, s.onboarding_status, b.name AS buyer, b.code AS company_code FROM invoices i JOIN suppliers s ON i.supplier_id = s.supplier_id JOIN buyers b ON i.buyer_id = b.buyer_id WHERE i.status = 'matched' AND s.onboarding_status = 'approved' ORDER BY s.supplier_id"
  );
  console.table(eligible);

  // Existing offer batches
  console.log('\n2) Existing offer_batches:');
  const [batches] = await conn.execute(
    "SELECT batch_id, supplier_id, buyer_id, invoice_count, status, send_mode, scheduled_send_at, sent_at, expires_at, created_at FROM offer_batches ORDER BY created_at DESC"
  );
  if (batches.length === 0) console.log('No offer batches exist.'); else console.table(batches);

  // Existing offers
  console.log('\n3) Existing offers:');
  const [offers] = await conn.execute(
    "SELECT o.offer_id, o.invoice_id, o.batch_id, o.annual_rate, o.days_to_maturity, o.discount_amount, o.net_payment_amount, o.status, o.sent_at, i.invoice_number, i.amount FROM offers o JOIN invoices i ON o.invoice_id = i.invoice_id ORDER BY o.offer_id DESC"
  );
  if (offers.length === 0) console.log('No offers exist.'); else console.table(offers);

  // Supplier summary
  console.log('\n4) Supplier summary (AAP1001):');
  const [summary] = await conn.execute(
    "SELECT s.supplier_id, s.name AS supplier, s.onboarding_status, COUNT(CASE WHEN i.status='matched' THEN 1 END) AS matched_count, COUNT(CASE WHEN i.status='offered' THEN 1 END) AS offered_count FROM suppliers s LEFT JOIN invoices i ON i.supplier_id = s.supplier_id WHERE s.company_code = 'AAP1001' GROUP BY s.supplier_id, s.name, s.onboarding_status ORDER BY s.supplier_id"
  );
  console.table(summary);

  // Sanity checks
  console.log('\n5) Sanity checks: offers without batch_id, invoices offered without batch linkage');
  const [offersNoBatch] = await conn.execute(
    "SELECT o.offer_id, o.invoice_id, o.batch_id, o.status FROM offers o WHERE o.batch_id IS NULL ORDER BY o.offer_id DESC"
  );
  console.table(offersNoBatch);
  const [offeredInvoices] = await conn.execute(
    "SELECT invoice_id, invoice_number, status FROM invoices WHERE status = 'offered' ORDER BY invoice_id DESC"
  );
  console.table(offeredInvoices);

  await conn.end();
}

main().catch(err => { console.error(err); process.exitCode = 1; });
