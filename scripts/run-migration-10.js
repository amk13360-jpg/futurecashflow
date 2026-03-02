/**
 * run-migration-10.js
 * Applies migration 10: Rename buyer_documents columns to match backend code
 *   document_name → file_name
 *   blob_url      → file_url
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

  console.log('═══ STEP 1: Rename buyer_documents columns ═══\n');

  // Check if file_name already exists (already renamed)
  const [existing] = await conn.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyer_documents'
      AND COLUMN_NAME IN ('file_name','file_url','document_name','blob_url')
  `);
  const existingNames = existing.map(r => r.COLUMN_NAME);
  console.log('  Current columns found:', existingNames);

  if (existingNames.includes('file_name') && existingNames.includes('file_url')) {
    console.log('  ⚠️  Columns already renamed — migration already applied, skipped.\n');
  } else {
    // Build the ALTER TABLE statement based on which old columns still exist
    const changes = [];
    if (existingNames.includes('document_name')) {
      changes.push('CHANGE COLUMN document_name file_name VARCHAR(255) NOT NULL');
    }
    if (existingNames.includes('blob_url')) {
      changes.push('CHANGE COLUMN blob_url file_url VARCHAR(500) NOT NULL');
    }

    if (changes.length === 0) {
      console.log('  ⚠️  No applicable columns found to rename.\n');
    } else {
      await conn.query(`ALTER TABLE buyer_documents ${changes.join(', ')}`);
      console.log(`  ✅ Renamed: ${changes.map(c => c.split(' ')[2] + ' → ' + c.split(' ')[3]).join(', ')}\n`);
    }
  }

  // Record migration
  try {
    await conn.query(
      `INSERT INTO system_settings (setting_key, setting_value, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['migration_10_applied', new Date().toISOString().slice(0,19).replace('T',' '), 'buyer_documents: document_name→file_name, blob_url→file_url']
    );
    console.log('  ✅ Recorded migration_10_applied in system_settings\n');
  } catch (err) {
    console.log(`  ⚠️  Could not record migration: ${err.message}\n`);
  }

  console.log('═══ STEP 2: Verify buyer_documents final schema ═══\n');

  const [cols] = await conn.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyer_documents'
      AND COLUMN_NAME IN ('file_name','file_url','document_type','uploaded_by','file_size')
    ORDER BY ORDINAL_POSITION
  `);
  console.table(cols);

  const colNames = cols.map(c => c.COLUMN_NAME);
  const allGood = ['file_name','file_url'].every(n => colNames.includes(n));
  if (allGood) {
    console.log('  ✅ file_name and file_url confirmed — buyer_documents fully aligned with backend code.\n');
  } else {
    console.log('  ❌ One or more expected columns still missing!\n');
  }

  console.log('═══ STEP 3: Verify document_type ENUM includes new types ═══\n');
  const [enumRow] = await conn.query(`
    SELECT COLUMN_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'fmf_scf_platform'
      AND TABLE_NAME   = 'buyer_documents'
      AND COLUMN_NAME  = 'document_type'
  `);
  const enumStr = enumRow[0]?.COLUMN_TYPE || '';
  const newTypes = ['mine_permit','environmental_clearance','royalty_agreement','supply_agreement'];
  const missingTypes = newTypes.filter(t => !enumStr.includes(t));
  if (missingTypes.length === 0) {
    console.log('  ✅ All 4 new document types present in ENUM.\n');
  } else {
    console.log(`  ❌ Missing ENUM values: ${missingTypes.join(', ')}\n`);
  }

  await conn.end();
  console.log('Migration 10 complete. Connection closed.');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
