/**
 * Live DB analysis: buyer cession agreement approval workflow
 * Run via: node scripts/analyse-cession-schema.js
 * Password supplied through DB_PASSWORD env variable - never hardcoded.
 */
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'futurefinancecashflow.mysql.database.azure.com',
    user:     process.env.DB_USER     || 'FMadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME     || 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true },
  });

  let pass = 0, fail = 0, warn = 0;
  const ok   = (m) => { console.log('  ✅', m); pass++; };
  const err  = (m) => { console.error('  ❌', m); fail++; };
  const wn   = (m) => { console.warn('  ⚠️ ', m); warn++; };

  async function colInfo(table, col) {
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, col]
    );
    return rows[0] || null;
  }

  // ── 1. cession_agreements: new columns ──────────────────────────────────
  console.log('\n1) cession_agreements — new buyer-approval columns');
  {
    const c1 = await colInfo('cession_agreements', 'buyer_approved_by');
    c1 ? ok(`buyer_approved_by  [${c1.COLUMN_TYPE}]  nullable=${c1.IS_NULLABLE}`)
       : err('buyer_approved_by is MISSING — run scripts/12-buyer-cession-approval.sql');

    const c2 = await colInfo('cession_agreements', 'buyer_approved_at');
    c2 ? ok(`buyer_approved_at  [${c2.COLUMN_TYPE}]  nullable=${c2.IS_NULLABLE}`)
       : err('buyer_approved_at is MISSING — run scripts/12-buyer-cession-approval.sql');
  }

  // ── 2. cession_agreements: status ENUM ──────────────────────────────────
  console.log('\n2) cession_agreements — status ENUM includes buyer_approved');
  {
    const c = await colInfo('cession_agreements', 'status');
    if (!c) {
      err('cession_agreements.status column not found!');
    } else {
      console.log('     Raw COLUMN_TYPE:', c.COLUMN_TYPE);
      if (c.COLUMN_TYPE.includes('buyer_approved')) {
        ok(`ENUM includes 'buyer_approved' — migration applied`);
      } else {
        err(`ENUM missing 'buyer_approved' — current: ${c.COLUMN_TYPE}  → run scripts/12-buyer-cession-approval.sql`);
      }
      // Check all expected values present
      for (const v of ['pending','signed','buyer_approved','approved','rejected']) {
        c.COLUMN_TYPE.includes(v)
          ? ok(`  ENUM value '${v}' present`)
          : err(`  ENUM value '${v}' MISSING`);
      }
    }
  }

  // ── 3. cession_agreements: buyer_id column (from migration 04) ──────────
  console.log('\n3) cession_agreements — buyer_id column (pre-requisite)');
  {
    const c = await colInfo('cession_agreements', 'buyer_id');
    c ? ok(`buyer_id  [${c.COLUMN_TYPE}]  nullable=${c.IS_NULLABLE}`)
      : err('buyer_id is MISSING — run scripts/04-phase1-schema-updates.sql');
  }

  // ── 4. FK: buyer_approved_by → users ────────────────────────────────────
  console.log('\n4) cession_agreements — FK constraint for buyer_approved_by');
  {
    const [rows] = await conn.query(
      `SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'cession_agreements'
         AND COLUMN_NAME = 'buyer_approved_by'
         AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    rows.length > 0
      ? ok(`FK fk_cession_buyer_approved_by → ${rows[0].REFERENCED_TABLE_NAME}.${rows[0].REFERENCED_COLUMN_NAME}`)
      : err('FK for buyer_approved_by is MISSING — run scripts/12-buyer-cession-approval.sql');
  }

  // ── 5. Index: idx_cession_status_buyer ──────────────────────────────────
  console.log('\n5) cession_agreements — composite index (buyer_id, status)');
  {
    const [rows] = await conn.query(
      `SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'cession_agreements'
         AND INDEX_NAME = 'idx_cession_status_buyer'
       GROUP BY INDEX_NAME`
    );
    rows.length > 0
      ? ok(`idx_cession_status_buyer on (${rows[0].cols})`)
      : wn('idx_cession_status_buyer missing — run scripts/12-buyer-cession-approval.sql (performance only, not blocking)');
  }

  // ── 6. buyers: require_cession_approval ─────────────────────────────────
  console.log('\n6) buyers — require_cession_approval flag');
  {
    const c = await colInfo('buyers', 'require_cession_approval');
    c ? ok(`require_cession_approval  [${c.COLUMN_TYPE}]  default=${c.COLUMN_DEFAULT}`)
      : err('buyers.require_cession_approval is MISSING');
  }

  // ── 7. suppliers: company_code (needed for buyer_id lookup on upload) ────
  console.log('\n7) suppliers — company_code (used to resolve buyer on upload)');
  {
    const c = await colInfo('suppliers', 'company_code');
    c ? ok(`company_code  [${c.COLUMN_TYPE}]  nullable=${c.IS_NULLABLE}`)
      : err('suppliers.company_code is MISSING — uploadCessionAgreement buyer lookup will always return null');
  }

  // ── 8. buyers: code column (join target from company_code) ──────────────
  console.log('\n8) buyers — code column (join target for company_code lookup)');
  {
    const c = await colInfo('buyers', 'code');
    c ? ok(`buyers.code  [${c.COLUMN_TYPE}]`)
      : err('buyers.code is MISSING');
  }

  // ── 9. Live data: cession_agreements current status distribution ─────────
  console.log('\n9) Live data — cession_agreements status distribution');
  {
    const [rows] = await conn.query(
      `SELECT status, COUNT(*) AS cnt, is_standing
       FROM cession_agreements
       GROUP BY status, is_standing
       ORDER BY status, is_standing`
    );
    if (rows.length === 0) {
      wn('No cession_agreements rows exist yet');
    } else {
      console.table(rows.map(r => ({ status: r.status, is_standing: r.is_standing, count: r.cnt })));
      ok('Status distribution retrieved');
    }
  }

  // ── 10. Live data: cessions with buyer_id populated ─────────────────────
  console.log('\n10) Live data — cession_agreements with buyer_id set');
  {
    const [rows] = await conn.query(
      `SELECT ca.cession_id, ca.status, ca.is_standing,
              ca.buyer_id, b.name AS buyer_name,
              s.name AS supplier_name,
              ca.signed_date, ca.updated_at
       FROM cession_agreements ca
       LEFT JOIN buyers b ON ca.buyer_id = b.buyer_id
       LEFT JOIN suppliers s ON ca.supplier_id = s.supplier_id
       ORDER BY ca.updated_at DESC
       LIMIT 20`
    );
    if (rows.length === 0) {
      wn('No rows in cession_agreements');
    } else {
      console.table(rows.map(r => ({
        id:       r.cession_id,
        status:   r.status,
        standing: r.is_standing,
        buyer:    r.buyer_name ?? '(none)',
        supplier: r.supplier_name,
        signed:   r.signed_date ?? '—',
      })));
      const noBuyer = rows.filter(r => !r.buyer_id).length;
      noBuyer > 0
        ? wn(`${noBuyer} cession(s) have NULL buyer_id — legacy rows before the fix`)
        : ok('All cession rows have buyer_id set');
    }
  }

  // ── 11. Buyers flagged as require_cession_approval = 1 ──────────────────
  console.log('\n11) Buyers with require_cession_approval = 1');
  {
    const [rows] = await conn.query(
      `SELECT buyer_id, name, code, require_cession_approval FROM buyers WHERE require_cession_approval = 1`
    );
    if (rows.length === 0) {
      wn('No buyers have require_cession_approval = 1 yet (flag is available but not enabled on any buyer)');
    } else {
      console.table(rows);
      ok(`${rows.length} buyer(s) have cession approval required`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`RESULT: ${pass} passed  |  ${warn} warnings  |  ${fail} failed`);
  if (fail === 0 && warn === 0) {
    console.log('\n✅  All checks passed — DB is fully aligned with the cession approval workflow.');
  } else if (fail === 0) {
    console.log('\n✅  No failures. Warnings are non-blocking.');
  } else {
    console.error(`\n❌  ${fail} check(s) failed — run scripts/12-buyer-cession-approval.sql on the live database.`);
    process.exitCode = 1;
  }

  await conn.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exitCode = 1; });
