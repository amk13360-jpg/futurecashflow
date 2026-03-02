/**
 * Run migrations 07 and 08 against Azure MySQL
 * 07 — payment_capture_type / payment_capture_value on buyers
 * 08 — mine_cession_approved / mine_approval_date / bank_change_effective_date on suppliers
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function main() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,   // required to run multi-statement SQL files
  });

  console.log('Connected to Azure MySQL.\n');

  const migrations = [
    '07-add-payment-capture-type-value.sql',
    '08-supplier-mine-cession-fields.sql',
  ];

  for (const file of migrations) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`SKIP: ${file} not found — skipping.`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`--- Running ${file} ---`);
    try {
      await conn.query(sql);
      console.log(`✅  ${file} applied successfully.\n`);
    } catch (err) {
      // "Duplicate column name" means the migration already ran — safe to continue
      if (err.code === 'ER_DUP_FIELDNAME' || (err.message && err.message.includes('Duplicate column'))) {
        console.log(`⚠️  ${file}: column already exists — migration was already applied previously.\n`);
      } else {
        console.error(`❌  ${file} FAILED:`, err.message);
        await conn.end();
        process.exit(1);
      }
    }
  }

  // ── Verify columns exist ──────────────────────────────────────────────────
  console.log('--- Post-migration verification ---\n');

  const checks = [
    { table: 'buyers',    columns: ['payment_capture_type', 'payment_capture_value'] },
    { table: 'suppliers', columns: ['mine_cession_approved', 'mine_approval_date', 'bank_change_effective_date'] },
  ];

  let allPassed = true;
  for (const { table, columns } of checks) {
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'fmf_scf_platform' AND TABLE_NAME = ?
         AND COLUMN_NAME IN (${columns.map(() => '?').join(',')})
       ORDER BY ORDINAL_POSITION`,
      [table, ...columns]
    );

    for (const col of columns) {
      const found = rows.find(r => r.COLUMN_NAME === col);
      if (found) {
        console.log(`✅  ${table}.${col}  [${found.COLUMN_TYPE}]  nullable=${found.IS_NULLABLE}  default=${found.COLUMN_DEFAULT ?? 'NULL'}`);
      } else {
        console.error(`❌  MISSING: ${table}.${col}`);
        allPassed = false;
      }
    }
  }

  console.log();
  if (allPassed) {
    console.log('All expected columns are present. Migrations verified ✅');
  } else {
    console.error('One or more columns are missing — investigate above.');
    process.exitCode = 1;
  }

  await conn.end();
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
