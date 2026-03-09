/**
 * run-migration-12.js
 * Safely applies migration 12 (buyer cession approval) to the live DB.
 * Each step is idempotent — safe to run multiple times.
 */
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host:     'futurefinancecashflow.mysql.database.azure.com',
    user:     'FMadmin',
    password: process.env.DB_PASSWORD,
    database: 'fmf_scf_platform',
    ssl:      { rejectUnauthorized: false },
  });

  const DB = 'fmf_scf_platform';
  let applied = 0, skipped = 0;

  async function colExists(table, col) {
    const [r] = await conn.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [DB, table, col]
    );
    return r.length > 0;
  }

  async function fkExists(constraint) {
    const [r] = await conn.query(
      `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME=? AND CONSTRAINT_TYPE='FOREIGN KEY'`,
      [DB, 'cession_agreements', constraint]
    );
    return r.length > 0;
  }

  async function idxExists(index) {
    const [r] = await conn.query(
      `SELECT 1 FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?`,
      [DB, 'cession_agreements', index]
    );
    return r.length > 0;
  }

  async function run(label, sql) {
    try {
      await conn.query(sql);
      console.log(`  ✅ ${label}`);
      applied++;
    } catch (e) {
      console.error(`  ❌ ${label}: ${e.message}`);
      throw e;
    }
  }

  console.log('\n=== Migration 12: Buyer Cession Approval ===\n');

  // ── Step 1: Extend ENUM ───────────────────────────────────────────────────
  console.log('Step 1: Extend status ENUM to include buyer_approved');
  const [enumRow] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA=? AND TABLE_NAME='cession_agreements' AND COLUMN_NAME='status'`,
    [DB]
  );
  if (enumRow[0] && enumRow[0].COLUMN_TYPE.includes('buyer_approved')) {
    console.log("  ⏭  ENUM already contains 'buyer_approved' — skipped"); skipped++;
  } else {
    await run('Modify status ENUM',
      `ALTER TABLE cession_agreements
       MODIFY COLUMN status
         ENUM('pending','signed','buyer_approved','approved','rejected')
         DEFAULT 'pending'`
    );
  }

  // ── Step 2: buyer_approved_by column ─────────────────────────────────────
  console.log('\nStep 2: Add buyer_approved_by column');
  if (await colExists('cession_agreements', 'buyer_approved_by')) {
    console.log('  ⏭  already exists — skipped'); skipped++;
  } else {
    await run('ADD COLUMN buyer_approved_by',
      `ALTER TABLE cession_agreements
       ADD COLUMN buyer_approved_by INT NULL AFTER approved_at`
    );
  }

  // ── Step 3: buyer_approved_at column ─────────────────────────────────────
  console.log('\nStep 3: Add buyer_approved_at column');
  if (await colExists('cession_agreements', 'buyer_approved_at')) {
    console.log('  ⏭  already exists — skipped'); skipped++;
  } else {
    await run('ADD COLUMN buyer_approved_at',
      `ALTER TABLE cession_agreements
       ADD COLUMN buyer_approved_at TIMESTAMP NULL AFTER buyer_approved_by`
    );
  }

  // ── Step 4: Foreign key ───────────────────────────────────────────────────
  console.log('\nStep 4: Add FK fk_cession_buyer_approved_by');
  if (await fkExists('fk_cession_buyer_approved_by')) {
    console.log('  ⏭  already exists — skipped'); skipped++;
  } else {
    await run('ADD CONSTRAINT fk_cession_buyer_approved_by',
      `ALTER TABLE cession_agreements
       ADD CONSTRAINT fk_cession_buyer_approved_by
         FOREIGN KEY (buyer_approved_by) REFERENCES users (user_id) ON DELETE SET NULL`
    );
  }

  // ── Step 5: Index ─────────────────────────────────────────────────────────
  console.log('\nStep 5: Add index idx_cession_status_buyer');
  if (await idxExists('idx_cession_status_buyer')) {
    console.log('  ⏭  already exists — skipped'); skipped++;
  } else {
    await run('ADD INDEX idx_cession_status_buyer (buyer_id, status)',
      `ALTER TABLE cession_agreements
       ADD INDEX idx_cession_status_buyer (buyer_id, status)`
    );
  }

  console.log(`\n${'─'.repeat(48)}`);
  console.log(`Migration 12 complete — ${applied} applied, ${skipped} skipped\n`);
  await conn.end();
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
