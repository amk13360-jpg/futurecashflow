/**
 * run-migration-09.js
 * Applies migration 09: Extend buyer_documents.document_type ENUM
 *   Adds: mine_permit, environmental_clearance, royalty_agreement, supply_agreement
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

async function main() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to Azure MySQL\n');

  console.log('═══ STEP 1: Extend buyer_documents.document_type ENUM ═══\n');

  try {
    await conn.query(`
      ALTER TABLE buyer_documents
        MODIFY COLUMN document_type ENUM(
          'cipc_certificate',
          'tax_clearance',
          'financial_statements',
          'bank_confirmation',
          'trade_references',
          'director_id',
          'resolution',
          'mine_permit',
          'environmental_clearance',
          'royalty_agreement',
          'supply_agreement',
          'other'
        ) NOT NULL
    `);
    console.log('  ✅ document_type ENUM extended with 4 new mine-specific types\n');
  } catch (err) {
    console.error(`  ❌ MODIFY COLUMN failed: ${err.message}`);
    await conn.end();
    process.exit(1);
  }

  // Record migration
  try {
    await conn.query(
      `INSERT INTO system_settings (setting_key, setting_value, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['migration_09_applied', new Date().toISOString().slice(0,19).replace('T',' '), 'buyer_documents.document_type ENUM extended with mine-specific types']
    );
    console.log('  ✅ Recorded migration_09_applied in system_settings\n');
  } catch (err) {
    console.log(`  ⚠️  Could not record migration: ${err.message}\n`);
  }

  console.log('═══ STEP 2: Verify buyer_documents.document_type ENUM ═══\n');

  const [cols] = await conn.query(`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyer_documents'
      AND COLUMN_NAME  = 'document_type'
  `);

  if (cols.length > 0) {
    const enumStr = cols[0].COLUMN_TYPE;
    console.log('  Current ENUM:', enumStr, '\n');

    const required = ['mine_permit','environmental_clearance','royalty_agreement','supply_agreement'];
    const missing  = required.filter(v => !enumStr.includes(v));

    if (missing.length === 0) {
      console.log('  ✅ All 4 new document types confirmed in ENUM.\n');
    } else {
      console.log(`  ❌ Still missing: ${missing.join(', ')}\n`);
    }
  }

  console.log('═══ STEP 3: Verify buyers payment_capture columns ═══\n');
  const [pcols] = await conn.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyers'
      AND COLUMN_NAME IN ('payment_capture_type','payment_capture_value')
  `);
  console.table(pcols);
  if (pcols.length === 2) {
    console.log('  ✅ payment_capture_type and payment_capture_value exist in buyers.\n');
  } else {
    console.log('  ❌ One or both payment_capture columns still missing from buyers.\n');
  }

  console.log('═══ STEP 4: Verify suppliers mine-cession columns ═══\n');
  const [scols] = await conn.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'suppliers'
      AND COLUMN_NAME IN ('mine_cession_approved','mine_approval_date','bank_change_effective_date')
  `);
  console.table(scols);
  if (scols.length === 3) {
    console.log('  ✅ All 3 mine-cession columns exist in suppliers.\n');
  } else {
    console.log('  ❌ One or more mine-cession columns missing from suppliers.\n');
  }

  await conn.end();
  console.log('All migrations verified. Connection closed.');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
