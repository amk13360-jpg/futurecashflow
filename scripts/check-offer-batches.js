const { getConnection } = require('./db-config');

async function fixDatabase() {
  const conn = await getConnection();

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    DATABASE FIX SCRIPT                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // 1. Check for orphaned offered invoices (offered but no offer record)
  console.log('1️⃣  Checking for orphaned "offered" invoices...');
  const [orphaned] = await conn.execute(`
    SELECT i.invoice_id, i.invoice_number, i.status
    FROM invoices i
    LEFT JOIN offers o ON i.invoice_id = o.invoice_id
    WHERE i.status = 'offered' AND o.offer_id IS NULL
  `);
  console.log(`   Found ${orphaned.length} orphaned invoices`);
  if (orphaned.length > 0) {
    console.table(orphaned);
  }

  // 2. Reset orphaned invoices back to 'matched'
  console.log('\n2️⃣  Resetting orphaned invoices to "matched"...');
  const [resetResult] = await conn.execute(`
    UPDATE invoices 
    SET status = 'matched' 
    WHERE status = 'offered' 
      AND invoice_id NOT IN (SELECT invoice_id FROM offers)
  `);
  console.log(`   Reset ${resetResult.affectedRows} invoices`);

  // 3. Delete empty batches
  console.log('\n3️⃣  Deleting empty offer batches...');
  const [deleteResult] = await conn.execute(`
    DELETE FROM offer_batches WHERE invoice_count = 0
  `);
  console.log(`   Deleted ${deleteResult.affectedRows} empty batches`);

  // 4. Verification
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                       VERIFICATION                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Current Invoice Status:');
  const [invoices] = await conn.execute(`
    SELECT invoice_id, invoice_number, status, vendor_number
    FROM invoices WHERE company_code = 'AAP1001'
    ORDER BY invoice_id
  `);
  console.table(invoices);

  console.log('\n📊 Current Offer Batches:');
  const [batches] = await conn.execute('SELECT * FROM offer_batches');
  console.log(`   Total batches: ${batches.length}`);

  console.log('\n📊 Eligible for Batching:');
  const [eligible] = await conn.execute(`
    SELECT COUNT(*) as count
    FROM invoices i
    JOIN suppliers s ON i.vendor_number = s.vendor_number AND i.company_code = s.company_code
    WHERE i.status = 'matched' 
      AND s.onboarding_status = 'approved'
      AND i.due_date > CURDATE()
  `);
  console.log(`   ${eligible[0].count} invoices ready for offer batching`);

  await conn.end();

  console.log('\n✅ Database fix complete!');
}

fixDatabase().catch(console.error);
