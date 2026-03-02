/**
 * Migration runner: 08-supplier-mine-cession-fields.sql
 * Verifies schema + backend alignment after migration.
 */
const mysql = require('mysql2/promise');

const config = {
  host: 'futurefinancecashflow.mysql.database.azure.com',
  user: 'FMadmin',
  password: 'REDACTED_DB_PASSWORD',
  database: 'fmf_scf_platform',
  ssl: { rejectUnauthorized: true },
  multipleStatements: false,
};

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to Azure MySQL\n');

  // ── 1. Run migration ────────────────────────────────────────────────────────
  console.log('═══ STEP 1: Running Migration 08 ═══\n');

  const migrations = [
    {
      label: 'ADD bank_change_effective_date',
      column: 'bank_change_effective_date',
      sql: `ALTER TABLE suppliers ADD COLUMN bank_change_effective_date DATE NULL`,
    },
    {
      label: 'ADD mine_cession_approved',
      column: 'mine_cession_approved',
      sql: `ALTER TABLE suppliers ADD COLUMN mine_cession_approved BOOLEAN NOT NULL DEFAULT FALSE`,
    },
    {
      label: 'ADD mine_approval_date',
      column: 'mine_approval_date',
      sql: `ALTER TABLE suppliers ADD COLUMN mine_approval_date DATE NULL`,
    },
    {
      label: 'Record migration in system_settings',
      column: null,
      sql: `INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
            VALUES ('migration_08_applied', NOW(), 'Mine cession approval fields added to suppliers')`,
    },
  ];

  for (const m of migrations) {
    try {
      // For column additions, check existence first (compatible with MySQL < 8.0.29)
      if (m.column) {
        const [existing] = await conn.execute(
          `SELECT COUNT(*) AS cnt
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = 'fmf_scf_platform'
             AND TABLE_NAME   = 'suppliers'
             AND COLUMN_NAME  = ?`,
          [m.column]
        );
        if (existing[0].cnt > 0) {
          console.log(`  ℹ️  ${m.label} — column already exists, skipped`);
          continue;
        }
      }
      await conn.execute(m.sql);
      console.log(`  ✅ ${m.label}`);
    } catch (err) {
      console.error(`  ❌ ${m.label} — ${err.message}`);
      throw err;
    }
  }

  // ── 2. Verify suppliers table schema ────────────────────────────────────────
  console.log('\n═══ STEP 2: Verify suppliers table columns ═══\n');

  const [cols] = await conn.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'suppliers'
      AND COLUMN_NAME  IN (
        'bank_change_effective_date',
        'mine_cession_approved',
        'mine_approval_date',
        'payment_capture_type',
        'payment_capture_value'
      )
    ORDER BY ORDINAL_POSITION
  `);

  if (cols.length === 0) {
    console.log('  ❌ No new columns found — migration may not have applied.');
  } else {
    console.table(cols);
    const found = cols.map(c => c.COLUMN_NAME);
    const required = ['bank_change_effective_date', 'mine_cession_approved', 'mine_approval_date'];
    const missing = required.filter(c => !found.includes(c));
    if (missing.length === 0) {
      console.log('  ✅ All 3 mine-cession columns present.');
    } else {
      console.log(`  ❌ Missing columns: ${missing.join(', ')}`);
    }
  }

  // ── 3. Verify buyers table ───────────────────────────────────────────────────
  console.log('\n═══ STEP 3: Verify buyers table (payment_capture fields) ═══\n');

  const [buyerCols] = await conn.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyers'
      AND COLUMN_NAME  IN ('payment_capture_type', 'payment_capture_value')
    ORDER BY ORDINAL_POSITION
  `);
  if (buyerCols.length === 0) {
    console.log('  ⚠️  payment_capture columns not yet applied — run migration 07 first.');
  } else {
    console.table(buyerCols);
    console.log('  ✅ buyers.payment_capture columns present.');
  }

  // ── 4. Verify buyer_documents table ─────────────────────────────────────────
  console.log('\n═══ STEP 4: Verify buyer_documents table ═══\n');

  const [docCols] = await conn.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyer_documents'
    ORDER BY ORDINAL_POSITION
  `);
  if (docCols.length === 0) {
    console.log('  ⚠️  buyer_documents table does not exist.');
  } else {
    console.table(docCols);
    console.log('  ✅ buyer_documents table present.');
  }

  // ── 5. Verify system_settings migration record ───────────────────────────────
  console.log('\n═══ STEP 5: Migration audit record ═══\n');

  const [settings] = await conn.execute(`
    SELECT setting_key, setting_value, description
    FROM system_settings
    WHERE setting_key IN ('migration_07_applied', 'migration_08_applied')
    ORDER BY setting_key
  `);
  if (settings.length === 0) {
    console.log('  ⚠️  No migration records found in system_settings.');
  } else {
    console.table(settings);
  }

  // ── 6. Backend alignment spot-check ─────────────────────────────────────────
  console.log('\n═══ STEP 6: Backend alignment — live data sample ═══\n');

  const [supplierSample] = await conn.execute(`
    SELECT supplier_id, name, onboarding_status,
           mine_cession_approved, mine_approval_date, bank_change_effective_date
    FROM suppliers
    ORDER BY supplier_id DESC
    LIMIT 5
  `);
  console.log('Recent suppliers (mine-cession fields):');
  console.table(supplierSample);

  const [buyerSample] = await conn.execute(`
    SELECT buyer_id, name, payment_capture_type, payment_capture_value
    FROM buyers
    ORDER BY buyer_id DESC
    LIMIT 5
  `);
  console.log('Recent buyers (payment-capture fields):');
  console.table(buyerSample);

  await conn.end();
  console.log('\n✅ Migration + verification complete.\n');
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exitCode = 1;
});
