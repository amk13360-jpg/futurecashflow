/**
 * run-migration-07.js
 * Applies migration 07: Add payment_capture_type & payment_capture_value to buyers table
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

async function addColumnSafe(conn, table, column, definition) {
  try {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  ✅ ADD ${column}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log(`  ⚠️  ${column} already exists — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to Azure MySQL\n');

  console.log('═══ STEP 1: Running Migration 07 ═══\n');

  await addColumnSafe(
    conn, 'buyers', 'payment_capture_type',
    "ENUM('weekly','monthly') NULL AFTER payment_capture_schedule"
  );
  await addColumnSafe(
    conn, 'buyers', 'payment_capture_value',
    "VARCHAR(20) NULL AFTER payment_capture_type"
  );

  // buyer_change_log field_name column update (idempotent MODIFY)
  try {
    await conn.query(`ALTER TABLE buyer_change_log MODIFY COLUMN field_name VARCHAR(100) NOT NULL`);
    console.log('  ✅ MODIFY buyer_change_log.field_name → VARCHAR(100)');
  } catch (err) {
    console.log(`  ⚠️  buyer_change_log.field_name MODIFY: ${err.message}`);
  }

  // Record migration
  try {
    await conn.query(`INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['migration_07_applied', new Date().toISOString().slice(0,19).replace('T',' '), 'Payment capture type/value fields added to buyers']);
    console.log('  ✅ Recorded migration_07_applied in system_settings\n');
  } catch (err) {
    console.log(`  ⚠️  Could not record migration: ${err.message}\n`);
  }

  console.log('═══ STEP 2: Verify buyers payment_capture columns ═══\n');

  const [cols] = await conn.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyers'
      AND COLUMN_NAME IN ('payment_capture_schedule','payment_capture_type','payment_capture_value')
    ORDER BY ORDINAL_POSITION
  `);
  console.table(cols);

  const names = cols.map(c => c.COLUMN_NAME);
  const allPresent = ['payment_capture_type','payment_capture_value'].every(n => names.includes(n));
  if (allPresent) {
    console.log('  ✅ Both payment_capture columns confirmed in buyers table.\n');
  } else {
    console.log('  ❌ One or more payment_capture columns still missing!\n');
  }

  await conn.end();
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
