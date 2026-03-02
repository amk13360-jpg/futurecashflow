/**
 * Verify DB schema + backend alignment for all recent changes:
 *   1. buyers: payment_capture_type, payment_capture_value
 *   2. suppliers: mine_cession_approved, mine_approval_date, bank_change_effective_date
 *   3. buyer_documents table structure
 *   4. Sample data checks
 */
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true },
  });

  console.log('=== SCHEMA & BACKEND ALIGNMENT VERIFICATION ===\n');
  let pass = 0, fail = 0;

  function ok(msg)   { console.log('  ✅', msg); pass++; }
  function err(msg)  { console.error('  ❌', msg); fail++; }
  function warn(msg) { console.warn('  ⚠️ ', msg); }

  // ── Helper: check column exists ───────────────────────────────────────────
  async function colInfo(table, column) {
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'fmf_scf_platform' AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows[0] || null;
  }

  // ── 1. buyers table new columns ───────────────────────────────────────────
  console.log('1) buyers table — payment processing schedule columns');
  {
    const c1 = await colInfo('buyers', 'payment_capture_type');
    if (c1) ok(`payment_capture_type  [${c1.COLUMN_TYPE}]  nullable=${c1.IS_NULLABLE}`);
    else     err('buyers.payment_capture_type is MISSING — run 07-add-payment-capture-type-value.sql');

    const c2 = await colInfo('buyers', 'payment_capture_value');
    if (c2) ok(`payment_capture_value [${c2.COLUMN_TYPE}]  nullable=${c2.IS_NULLABLE}`);
    else     err('buyers.payment_capture_value is MISSING — run 07-add-payment-capture-type-value.sql');

    // Verify ENUM values match backend validation
    if (c1 && c1.COLUMN_TYPE.includes('weekly') && c1.COLUMN_TYPE.includes('monthly')) {
      ok(`payment_capture_type ENUM contains 'weekly','monthly' — matches backend validation`);
    } else if (c1) {
      err(`payment_capture_type ENUM type mismatch: got ${c1.COLUMN_TYPE}`);
    }
  }

  // ── 2. suppliers table new columns ────────────────────────────────────────
  console.log('\n2) suppliers table — mine cession approval columns');
  {
    for (const col of ['mine_cession_approved', 'mine_approval_date', 'bank_change_effective_date']) {
      const c = await colInfo('suppliers', col);
      if (c) ok(`${col}  [${c.COLUMN_TYPE}]  nullable=${c.IS_NULLABLE}  default=${c.COLUMN_DEFAULT ?? 'NULL'}`);
      else   err(`suppliers.${col} is MISSING — run 08-supplier-mine-cession-fields.sql`);
    }
  }

  // ── 3. buyer_documents table ──────────────────────────────────────────────
  console.log('\n3) buyer_documents table — core columns');
  {
    const required = ['document_id','buyer_id','document_type','file_name','file_url',
                      'file_size','uploaded_by','uploaded_at','verification_status'];
    for (const col of required) {
      const c = await colInfo('buyer_documents', col);
      if (c) ok(`${col}  [${c.COLUMN_TYPE}]`);
      else   err(`buyer_documents.${col} is MISSING`);
    }
  }

  // ── 4. buyers INSERT column count check ───────────────────────────────────
  console.log('\n4) buyers table — current column count');
  {
    const [cols] = await conn.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'fmf_scf_platform' AND TABLE_NAME = 'buyers'`
    );
    ok(`buyers table has ${cols[0].cnt} columns total`);
    // Backend action inserts 27 params — verify at least those 27 cols exist
    if (cols[0].cnt >= 27) ok('Column count satisfies backend INSERT (27 params)');
    else warn(`Column count is ${cols[0].cnt} — backend INSERT expects at least 27 params; check lib/actions/buyers.ts`);
  }

  // ── 5. suppliers SELECT fields ────────────────────────────────────────────
  console.log('\n5) suppliers table — key fields used in admin.ts');
  {
    const fields = ['supplier_id','name','contact_email','onboarding_status',
                    'mine_cession_approved','mine_approval_date','bank_change_effective_date'];
    for (const col of fields) {
      const c = await colInfo('suppliers', col);
      if (c) ok(`suppliers.${col}  [${c.COLUMN_TYPE}]`);
      else   err(`suppliers.${col} is MISSING — getSupplierApplicationById will fail`);
    }
  }

  // ── 6. buyer_change_log table (used for audit) ────────────────────────────
  console.log('\n6) buyer_change_log table — used by upload and update audit logging');
  {
    const required = ['buyer_id','field_name','old_value','new_value','changed_by'];
    for (const col of required) {
      const c = await colInfo('buyer_change_log', col);
      if (c) ok(`buyer_change_log.${col}  [${c.COLUMN_TYPE}]`);
      else   err(`buyer_change_log.${col} is MISSING`);
    }
  }

  // ── 7. invoices table — offer_count join compatibility ────────────────────
  console.log('\n7) invoices + offers — AP offer status join check');
  {
    const [result] = await conn.query(
      `SELECT COUNT(*) as cnt FROM invoices i
       LEFT JOIN offers o ON i.invoice_id = o.invoice_id
       LIMIT 1`
    );
    ok(`invoices LEFT JOIN offers executes successfully (getInvoicesForSession AP branch)`);
  }

  // ── 8. Sample data snapshot ───────────────────────────────────────────────
  console.log('\n8) Sample data snapshots');
  {
    const [buyers] = await conn.query(
      `SELECT buyer_id, name, payment_capture_type, payment_capture_value FROM buyers LIMIT 5`
    );
    console.log('   buyers (first 5):');
    console.table(buyers.map(r => ({
      id: r.buyer_id, name: r.name,
      type: r.payment_capture_type ?? '(null)',
      value: r.payment_capture_value ?? '(null)'
    })));

    const [sups] = await conn.query(
      `SELECT supplier_id, name, mine_cession_approved, mine_approval_date, bank_change_effective_date
       FROM suppliers LIMIT 5`
    );
    console.log('   suppliers (first 5):');
    console.table(sups.map(r => ({
      id: r.supplier_id, name: r.name,
      mine_approved: r.mine_cession_approved,
      approval_date: r.mine_approval_date ?? '(null)',
      effective_date: r.bank_change_effective_date ?? '(null)'
    })));

    const [docs] = await conn.query(
      `SELECT document_id, buyer_id, document_type, file_name, verification_status, uploaded_at
       FROM buyer_documents ORDER BY uploaded_at DESC LIMIT 5`
    );
    console.log(`   buyer_documents (most recent 5, total counted below):`);
    if (docs.length === 0) warn('No buyer documents yet — table exists but is empty');
    else console.table(docs);

    const [docCount] = await conn.query('SELECT COUNT(*) as cnt FROM buyer_documents');
    ok(`buyer_documents total rows: ${docCount[0].cnt}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  if (fail === 0) {
    console.log('\n✅  All checks passed — DB schema and backend are aligned.');
  } else {
    console.error(`\n❌  ${fail} check(s) failed — see errors above.`);
    process.exitCode = 1;
  }

  await conn.end();
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
