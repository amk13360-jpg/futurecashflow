const { getConnection } = require('./db-config');

async function cleanup() {
  const conn = await getConnection();

  console.log('=== DATABASE CLEANUP ===\n');

  // Step 1: Delete corrupt offers from batch 52
  console.log('1. Deleting corrupt offers (status=draft) from batch 52...');
  const [delOffers] = await conn.execute(`DELETE FROM offers WHERE batch_id = 52`);
  console.log(`   Deleted ${delOffers.affectedRows} offers\n`);

  // Step 2: Delete batch 52
  console.log('2. Deleting batch 52...');
  const [delBatch] = await conn.execute(`DELETE FROM offer_batches WHERE batch_id = 52`);
  console.log(`   Deleted ${delBatch.affectedRows} batch(es)\n`);

  // Step 3: Reset Ngwenya invoices (160, 161) from 'offered' back to 'matched'
  console.log('3. Resetting invoices 160, 161 from "offered" to "matched"...');
  const [updInv] = await conn.execute(
    `UPDATE invoices SET status = 'matched' WHERE invoice_id IN (160, 161) AND status = 'offered'`
  );
  console.log(`   Updated ${updInv.affectedRows} invoices\n`);

  // Step 4: Approve Khumalo Mining (supplier 111) so both suppliers are eligible
  console.log('4. Approving Khumalo Mining (supplier 111)...');
  const [updSup] = await conn.execute(
    `UPDATE suppliers SET onboarding_status = 'approved' WHERE supplier_id = 111 AND onboarding_status = 'pending'`
  );
  console.log(`   Updated ${updSup.affectedRows} supplier(s)\n`);

  // Verify
  console.log('=== VERIFICATION ===\n');

  const [invoices] = await conn.execute(
    `SELECT invoice_id, invoice_number, vendor_number, status, amount FROM invoices ORDER BY invoice_id`
  );
  console.log('Invoices:');
  console.table(invoices);

  const [suppliers] = await conn.execute(
    `SELECT supplier_id, name, vendor_number, onboarding_status, contact_email FROM suppliers ORDER BY supplier_id`
  );
  console.log('Suppliers:');
  console.table(suppliers);

  const [offers] = await conn.execute(`SELECT * FROM offers`);
  console.log(`Offers remaining: ${offers.length}`);

  const [batches] = await conn.execute(`SELECT * FROM offer_batches`);
  console.log(`Batches remaining: ${batches.length}`);

  // Check eligible invoices (same query as the app uses)
  const [eligible] = await conn.execute(`
    SELECT i.invoice_id, i.invoice_number, i.vendor_number, i.amount, i.due_date,
           s.name AS supplier_name, s.onboarding_status,
           DATEDIFF(i.due_date, NOW()) AS days_to_maturity
    FROM invoices i
    JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
    WHERE i.status = 'matched'
      AND s.onboarding_status = 'approved'
      AND s.active_status = 'active'
      AND DATEDIFF(i.due_date, NOW()) > 0
    ORDER BY s.name, i.due_date
  `);
  console.log(`\nEligible for batching: ${eligible.length}`);
  if (eligible.length > 0) console.table(eligible);

  await conn.end();
  console.log('\n=== CLEANUP COMPLETE ===');
}

cleanup().catch(err => { console.error(err); process.exit(1); });
