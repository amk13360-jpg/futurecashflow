/**
 * db-full-report.js
 * Comprehensive live database analysis for fmf_scf_platform.
 * Pulls real schema, row counts, ENUMs, FKs, indexes.
 * Cross-checks every table/column referenced in the backend code.
 * Writes findings to: DB_ANALYSIS_REPORT.md
 *
 * Run: $env:DB_PASSWORD='FmfDev#2025!SqlA'; node scripts/db-full-report.js
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');

const DB = 'fmf_scf_platform';
const OUT = 'DB_ANALYSIS_REPORT.md';

// ── Backend column requirements (derived from lib/actions/**) ─────────────
const REQUIRED_COLUMNS = {
  // ── lib/actions/admin.ts ─────────────────────────────────────────────────
  cession_agreements: [
    'cession_id','supplier_id','buyer_id','document_url','document_type',
    'version','signed_date','status','approved_by','approved_at',
    'buyer_approved_by','buyer_approved_at',        // migration 12
    'is_standing','created_at','updated_at',
  ],
  suppliers: [
    'supplier_id','name','vat_no','registration_no','contact_person',
    'contact_email','contact_phone','physical_address','address',
    'bank_name','bank_account_no','bank_branch_code','bank_account_type',
    'risk_tier','onboarding_status','active_status',
    'company_code','vendor_number',
    'password_hash','password_set_at',
    'mine_cession_approved','mine_approval_date','bank_change_effective_date', // migration 08
    'created_at','updated_at',
  ],
  buyers: [
    'buyer_id','name','trading_name','code','registration_no','tax_id',
    'industry_sector','risk_tier',
    'physical_address_street','physical_address_city',
    'physical_address_province','physical_address_postal',
    'primary_contact_name','contact_email','contact_phone',
    'financial_contact_name','financial_contact_email',
    'min_invoice_amount','max_invoice_amount',
    'min_days_to_maturity','max_days_to_maturity',
    'credit_limit','rate_card_id','payment_capture_schedule',
    'payment_capture_type','payment_capture_value',    // migration 07
    'require_cession_approval',                        // business logic flag
    'created_by','active_status',
    'created_at','updated_at',
  ],
  users: [
    'user_id','username','email','password_hash','role',
    'buyer_id','full_name','active_status',
    'created_at','updated_at','last_login_at',
  ],
  invoices: [
    'invoice_id','buyer_id','supplier_id','invoice_number',
    'invoice_date','due_date','amount','currency','description',
    'status','uploaded_by','uploaded_at','updated_at',
    'company_code','vendor_number',
  ],
  offers: [
    'offer_id','invoice_id','supplier_id','buyer_id','batch_id',
    'annual_rate','days_to_maturity','discount_amount','net_payment_amount',
    'offer_expiry_date','status','sent_at','responded_at','created_at',
  ],
  offer_batches: [
    'batch_id','buyer_id','created_by','status',
    'created_at','updated_at',
  ],
  payments: [
    'payment_id','offer_id','supplier_id','amount','currency',
    'payment_reference','status','scheduled_date','completed_date',
    'batch_id','processed_by','created_at',
  ],
  bank_change_requests: [
    'request_id','supplier_id',
    'old_bank_name','old_account_no',
    'new_bank_name','new_account_no','new_branch_code','new_account_type',
    'reason','supporting_document_url',
    'status','reviewed_by','reviewed_at','review_notes',
    'effective_date',
    'created_at','updated_at',
  ],
  buyer_documents: [
    'document_id','buyer_id','document_type','file_name','file_url',
    'file_size','uploaded_by','uploaded_at','verification_status',
  ],
  buyer_change_log: [
    'log_id','buyer_id','field_name','old_value','new_value',
    'change_reason','requires_approval','changed_by','changed_at',
  ],
  audit_logs: [
    'log_id','user_id','user_type','action',
    'entity_type','entity_id','details','ip_address','user_agent','created_at',
  ],
  supplier_tokens: [
    'token_id','supplier_id','token','token_type','expires_at',
    'used_at','created_at',
  ],
  rate_cards: [
    'rate_card_id','name','description','base_annual_rate',
    'tier_a_adjustment','tier_b_adjustment','tier_c_adjustment',
    'is_active','created_at','updated_at',
  ],
  system_settings: [
    'setting_id','setting_key','setting_value','setting_type',
    'description','updated_by','updated_at',
  ],
  // standing_cession addendums are stored in cession_agreements via parent_cession_id
  // (no separate cession_addendums table — by design)
};

// ── ENUM expectations ─────────────────────────────────────────────────────
const REQUIRED_ENUMS = {
  'cession_agreements.status':       ['pending','signed','buyer_approved','approved','rejected'],
  'buyers.payment_capture_type':     ['weekly','monthly'],
  'suppliers.bank_account_type':     ['current','savings','business'],
  'suppliers.onboarding_status':     ['pending','documents_submitted','approved','rejected'],
  'suppliers.active_status':         ['active','inactive','suspended'],
  'invoices.status':                 ['pending','matched','offered','accepted','paid','rejected'],
  'offers.status':                   ['sent','opened','accepted','rejected','expired'],
  'payments.status':                 ['queued','processing','completed','failed','cancelled'],
  'bank_change_requests.status':     ['pending','approved','rejected'],
  'users.role':                      ['admin','accounts_payable','auditor'],
};

async function main() {
  const conn = await mysql.createConnection({
    host:     'futurefinancecashflow.mysql.database.azure.com',
    user:     'FMadmin',
    password: process.env.DB_PASSWORD,
    database: DB,
    ssl:      { rejectUnauthorized: false },
  });

  const lines = [];
  const ts = new Date().toISOString().replace('T',' ').slice(0,19);

  function h1(t)  { lines.push(`\n# ${t}`); }
  function h2(t)  { lines.push(`\n## ${t}`); }
  function h3(t)  { lines.push(`\n### ${t}`); }
  function p(t)   { lines.push(t); }
  function ok(t)  { lines.push(`- ✅ ${t}`); }
  function fail(t){ lines.push(`- ❌ ${t}`); }
  function warn(t){ lines.push(`- ⚠️  ${t}`); }
  function info(t){ lines.push(`- ℹ️  ${t}`); }

  let totalPass = 0, totalFail = 0, totalWarn = 0;
  function PASS(t) { ok(t);   totalPass++; }
  function FAIL(t) { fail(t); totalFail++; }
  function WARN(t) { warn(t); totalWarn++; }

  // ── Helpers ──────────────────────────────────────────────────────────────
  async function allColumns(table) {
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME=?
       ORDER BY ORDINAL_POSITION`,
      [DB, table]
    );
    return rows;
  }

  async function allTables() {
    const [rows] = await conn.query(
      `SELECT TABLE_NAME, TABLE_ROWS, AUTO_INCREMENT, TABLE_COMMENT
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA=?
       ORDER BY TABLE_NAME`,
      [DB]
    );
    return rows;
  }

  async function allFKs() {
    const [rows] = await conn.query(
      `SELECT k.TABLE_NAME, k.CONSTRAINT_NAME, k.COLUMN_NAME,
              k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
              r.UPDATE_RULE, r.DELETE_RULE
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.TABLE_SCHEMA
        AND r.CONSTRAINT_NAME   = k.CONSTRAINT_NAME
       WHERE k.TABLE_SCHEMA = ?
         AND k.REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME`,
      [DB]
    );
    return rows;
  }

  async function allIndexes() {
    const [rows] = await conn.query(
      `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE,
              GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') AS cols
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA=?
       GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
       ORDER BY TABLE_NAME, INDEX_NAME`,
      [DB]
    );
    return rows;
  }

  async function rowCount(table) {
    try {
      const [r] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
      return r[0].cnt;
    } catch { return '(error)'; }
  }

  async function enumValues(table, col) {
    const [rows] = await conn.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [DB, table, col]
    );
    if (!rows[0]) return null;
    const raw = rows[0].COLUMN_TYPE;
    const match = raw.match(/enum\((.+)\)/i);
    if (!match) return null;
    return match[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
  }

  // ═══════════════════════════════════════════════════════════════════════
  p(`# DB Analysis Report — fmf_scf_platform`);
  p(`**Generated:** ${ts} UTC  `);
  p(`**Host:** futurefinancecashflow.mysql.database.azure.com  `);
  p(`**Database:** ${DB}`);
  p('');
  p('---');

  // ── SECTION 1: All tables with row counts ──────────────────────────────
  h1('1. Tables Overview');
  const tables = await allTables();
  p('');
  p('| Table | Approx Rows | Auto-Inc |');
  p('|-------|------------|---------|');
  for (const t of tables) {
    const exact = await rowCount(t.TABLE_NAME);
    p(`| \`${t.TABLE_NAME}\` | ${exact} | ${t.AUTO_INCREMENT ?? '—'} |`);
  }

  const tableNames = tables.map(t => t.TABLE_NAME);
  const expectedTables = Object.keys(REQUIRED_COLUMNS);
  const missingTables  = expectedTables.filter(t => !tableNames.includes(t));

  h2('Missing Expected Tables');
  if (missingTables.length === 0) {
    PASS('All expected tables exist in the database');
  } else {
    for (const t of missingTables) FAIL(`Table \`${t}\` is MISSING`);
  }

  // ── SECTION 2: Full column details per table ───────────────────────────
  h1('2. Column-Level Schema (all tables)');

  for (const t of tables) {
    h2(`\`${t.TABLE_NAME}\``);
    const cols = await allColumns(t.TABLE_NAME);
    p('');
    p('| Column | Type | Nullable | Default | Extra |');
    p('|--------|------|----------|---------|-------|');
    for (const c of cols) {
      p(`| \`${c.COLUMN_NAME}\` | ${c.COLUMN_TYPE} | ${c.IS_NULLABLE} | ${c.COLUMN_DEFAULT ?? 'NULL'} | ${c.EXTRA || ''} |`);
    }
  }

  // ── SECTION 3: Backend column requirements check ───────────────────────
  h1('3. Backend vs DB Column Alignment');
  p('Cross-checking every column referenced in `lib/actions/**` against live DB.');
  p('');

  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    h2(`\`${table}\``);
    if (!tableNames.includes(table)) {
      FAIL(`Table \`${table}\` not in DB — all column checks skipped`);
      continue;
    }
    const cols = await allColumns(table);
    const colNames = cols.map(c => c.COLUMN_NAME);
    let pass = 0, miss = 0;
    for (const col of required) {
      if (colNames.includes(col)) {
        const meta = cols.find(c => c.COLUMN_NAME === col);
        PASS(`${col}  [${meta.COLUMN_TYPE}]  nullable=${meta.IS_NULLABLE}`);
        pass++;
      } else {
        FAIL(`\`${col}\` — MISSING in \`${table}\``);
        miss++;
      }
    }
    // Extra columns in DB not in our list (informational)
    const extra = colNames.filter(c => !required.includes(c));
    if (extra.length > 0) {
      info(`Extra columns (not in backend requirements): ${extra.map(c=>`\`${c}\``).join(', ')}`);
    }
  }

  // ── SECTION 4: ENUM validation ─────────────────────────────────────────
  h1('4. ENUM Value Validation');
  p('Every ENUM column used in backend code is verified to contain required values.');
  p('');

  for (const [key, needed] of Object.entries(REQUIRED_ENUMS)) {
    const [table, col] = key.split('.');
    h2(`\`${table}.${col}\``);
    if (!tableNames.includes(table)) { FAIL(`Table \`${table}\` missing`); continue; }
    const vals = await enumValues(table, col);
    if (!vals) { FAIL(`\`${col}\` not found or not ENUM in \`${table}\``); continue; }
    info(`Raw ENUM: \`${vals.join("', '")}\``);
    for (const v of needed) {
      if (vals.includes(v)) PASS(`'${v}' present`);
      else                  FAIL(`'${v}' MISSING — backend expects this value`);
    }
    const extra = vals.filter(v => !needed.includes(v));
    if (extra.length) info(`Extra ENUM values (not checked): ${extra.map(v=>`'${v}'`).join(', ')}`);
  }

  // ── SECTION 5: Foreign Keys ────────────────────────────────────────────
  h1('5. Foreign Key Constraints');
  const fks = await allFKs();
  p('');
  p('| Table | Constraint | Column | → Table | → Column | On Delete |');
  p('|-------|-----------|--------|---------|---------|-----------|');
  for (const fk of fks) {
    p(`| \`${fk.TABLE_NAME}\` | \`${fk.CONSTRAINT_NAME}\` | \`${fk.COLUMN_NAME}\` | \`${fk.REFERENCED_TABLE_NAME}\` | \`${fk.REFERENCED_COLUMN_NAME}\` | ${fk.DELETE_RULE} |`);
  }

  // Check critical FKs
  h2('Critical FK Checks');
  const criticalFKs = [
    { table: 'cession_agreements', col: 'buyer_id',          ref: 'buyers',    name: 'FK for buyer_id' },
    { table: 'cession_agreements', col: 'buyer_approved_by', ref: 'users',     name: 'FK for buyer_approved_by (migration 12)' },
    { table: 'invoices',           col: 'buyer_id',          ref: 'buyers',    name: 'FK invoices.buyer_id' },
    { table: 'offers',             col: 'buyer_id',          ref: 'buyers',    name: 'FK offers.buyer_id' },
    { table: 'users',              col: 'buyer_id',          ref: 'buyers',    name: 'FK users.buyer_id' },
  ];
  for (const ck of criticalFKs) {
    const exists = fks.some(fk => fk.TABLE_NAME === ck.table && fk.COLUMN_NAME === ck.col && fk.REFERENCED_TABLE_NAME === ck.ref);
    if (exists) PASS(ck.name);
    else        WARN(`${ck.name} — no FK constraint (data integrity risk)`);
  }

  // ── SECTION 6: Indexes ────────────────────────────────────────────────
  h1('6. Indexes');
  const indexes = await allIndexes();
  p('');
  p('| Table | Index | Unique | Columns |');
  p('|-------|-------|--------|---------|');
  for (const ix of indexes) {
    p(`| \`${ix.TABLE_NAME}\` | \`${ix.INDEX_NAME}\` | ${ix.NON_UNIQUE === 0 ? 'YES' : 'no'} | ${ix.cols} |`);
  }

  // Check specific expected indexes
  h2('Expected Index Checks');
  const expectedIndexes = [
    { table: 'cession_agreements', name: 'idx_cession_status_buyer',  desc: 'buyer_id + status (migration 12 perf)' },
    { table: 'suppliers',          name: 'idx_onboarding_status',     desc: 'supplier onboarding queries' },
    { table: 'invoices',           name: 'idx_status',                desc: 'invoice status filter' },
    { table: 'offers',             name: 'idx_status',                desc: 'offer status filter' },
    { table: 'supplier_tokens',    name: 'idx_expires_at',            desc: 'token expiry cleanup' },
  ];
  for (const ei of expectedIndexes) {
    const exists = indexes.some(ix => ix.TABLE_NAME === ei.table && ix.INDEX_NAME === ei.name);
    if (exists) PASS(`\`${ei.table}.${ei.name}\` — ${ei.desc}`);
    else        WARN(`\`${ei.table}.${ei.name}\` missing — ${ei.desc}`);
  }

  // ── SECTION 7: Live data snapshots ────────────────────────────────────
  h1('7. Live Data Snapshots');

  // 7a. cession_agreements breakdown
  h2('cession_agreements — status × is_standing');
  try {
    const [rows] = await conn.query(
      `SELECT status, is_standing, COUNT(*) AS cnt FROM cession_agreements GROUP BY status, is_standing ORDER BY status`
    );
    p('');
    p('| status | is_standing | count |');
    p('|--------|------------|-------|');
    for (const r of rows) p(`| ${r.status} | ${r.is_standing} | ${r.cnt} |`);
    if (rows.length === 0) warn('Table is empty');
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7b. buyers with require_cession_approval
  h2('buyers — require_cession_approval distribution');
  try {
    const [rows] = await conn.query(
      `SELECT require_cession_approval, COUNT(*) AS cnt FROM buyers GROUP BY require_cession_approval`
    );
    p('');
    p('| require_cession_approval | count |');
    p('|--------------------------|-------|');
    for (const r of rows) p(`| ${r.require_cession_approval} | ${r.cnt} |`);
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7c. invoices by status
  h2('invoices — status distribution');
  try {
    const [rows] = await conn.query(
      `SELECT status, COUNT(*) AS cnt FROM invoices GROUP BY status ORDER BY cnt DESC`
    );
    p('');
    p('| status | count |');
    p('|--------|-------|');
    for (const r of rows) p(`| ${r.status} | ${r.cnt} |`);
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7d. offers by status
  h2('offers — status distribution');
  try {
    const [rows] = await conn.query(
      `SELECT status, COUNT(*) AS cnt FROM offers GROUP BY status ORDER BY cnt DESC`
    );
    p('');
    p('| status | count |');
    p('|--------|-------|');
    for (const r of rows) p(`| ${r.status} | ${r.cnt} |`);
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7e. buyers table — payment_capture_type populated?
  h2('buyers — payment_capture_type distribution');
  try {
    const [rows] = await conn.query(
      `SELECT payment_capture_type, COUNT(*) AS cnt FROM buyers GROUP BY payment_capture_type`
    );
    p('');
    p('| payment_capture_type | count |');
    p('|----------------------|-------|');
    for (const r of rows) p(`| ${r.payment_capture_type ?? 'NULL'} | ${r.cnt} |`);
  } catch (e) { FAIL(`Likely column missing: ${e.message}`); }

  // 7f. suppliers mine_cession_approved
  h2('suppliers — mine_cession_approved distribution');
  try {
    const [rows] = await conn.query(
      `SELECT mine_cession_approved, COUNT(*) AS cnt FROM suppliers GROUP BY mine_cession_approved`
    );
    p('');
    p('| mine_cession_approved | count |');
    p('|-----------------------|-------|');
    for (const r of rows) p(`| ${r.mine_cession_approved} | ${r.cnt} |`);
  } catch (e) { FAIL(`Likely column missing: ${e.message}`); }

  // 7g. bank_change_requests by status
  h2('bank_change_requests — status distribution');
  try {
    const [rows] = await conn.query(
      `SELECT status, COUNT(*) AS cnt FROM bank_change_requests GROUP BY status`
    );
    p('');
    p('| status | count |');
    p('|--------|-------|');
    for (const r of rows) p(`| ${r.status} | ${r.cnt} |`);
    if (rows.length === 0) info('Table is empty');
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7h. Users by role
  h2('users — role distribution');
  try {
    const [rows] = await conn.query(
      `SELECT role, buyer_id IS NOT NULL AS has_buyer, COUNT(*) AS cnt FROM users GROUP BY role, has_buyer`
    );
    p('');
    p('| role | has_buyer_id | count |');
    p('|------|-------------|-------|');
    for (const r of rows) p(`| ${r.role} | ${r.has_buyer} | ${r.cnt} |`);
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7i. buyer_documents by type and verification_status
  h2('buyer_documents — document_type distribution');
  try {
    const [rows] = await conn.query(
      `SELECT document_type, verification_status, COUNT(*) AS cnt
       FROM buyer_documents GROUP BY document_type, verification_status ORDER BY cnt DESC`
    );
    p('');
    p('| document_type | verification_status | count |');
    p('|---------------|---------------------|-------|');
    for (const r of rows) p(`| ${r.document_type} | ${r.verification_status} | ${r.cnt} |`);
    if (rows.length === 0) info('buyer_documents table is empty');
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // 7j. payments status
  h2('payments — status distribution');
  try {
    const [rows] = await conn.query(
      `SELECT status, COUNT(*) AS cnt, SUM(amount) AS total FROM payments GROUP BY status`
    );
    p('');
    p('| status | count | total_amount |');
    p('|--------|-------|-------------|');
    for (const r of rows) p(`| ${r.status} | ${r.cnt} | ${r.total ?? 0} |`);
  } catch (e) { FAIL(`Query failed: ${e.message}`); }

  // ── SECTION 8: Potential data integrity issues ────────────────────────
  h1('8. Data Integrity Checks');

  // Cessions with NULL buyer_id
  h2('cession_agreements with NULL buyer_id');
  try {
    const [r] = await conn.query(`SELECT COUNT(*) AS cnt FROM cession_agreements WHERE buyer_id IS NULL`);
    if (r[0].cnt > 0) WARN(`${r[0].cnt} cession(s) have NULL buyer_id — these pre-date the buyer_id fix`);
    else             PASS('All cession_agreements have buyer_id set');
  } catch (e) { FAIL(e.message); }

  // Orphan offers (no invoice)
  h2('offers with no matching invoice');
  try {
    const [r] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM offers o
       LEFT JOIN invoices i ON o.invoice_id = i.invoice_id
       WHERE i.invoice_id IS NULL`
    );
    if (r[0].cnt > 0) WARN(`${r[0].cnt} orphan offer(s) — invoice not found`);
    else             PASS('No orphan offers');
  } catch (e) { FAIL(e.message); }

  // Offers accepted but invoice not accepted
  h2('offers=accepted but invoice≠accepted');
  try {
    const [r] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM offers o
       JOIN invoices i ON o.invoice_id = i.invoice_id
       WHERE o.status = 'accepted' AND i.status != 'accepted'`
    );
    if (r[0].cnt > 0) WARN(`${r[0].cnt} offer(s) accepted but matching invoice is not in 'accepted' status`);
    else             PASS('offers/invoice status sync is consistent');
  } catch (e) { FAIL(e.message); }

  // Suppliers with onboarding_status=approved but no supplier_token
  h2('approved suppliers with no access token');
  try {
    const [r] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM suppliers s
       WHERE s.onboarding_status = 'approved'
         AND NOT EXISTS (
           SELECT 1 FROM supplier_tokens t
           WHERE t.supplier_id = s.supplier_id
         )`
    );
    if (r[0].cnt > 0) WARN(`${r[0].cnt} approved supplier(s) have no supplier_token row`);
    else             PASS('All approved suppliers have at least one token');
  } catch (e) { FAIL(e.message); }

  // Users with role=accounts_payable but no buyer_id
  h2('accounts_payable users with no buyer_id');
  try {
    const [r] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM users WHERE role='accounts_payable' AND buyer_id IS NULL`
    );
    if (r[0].cnt > 0) WARN(`${r[0].cnt} AP user(s) have NULL buyer_id — they cannot use AP portal`);
    else             PASS('All AP users have buyer_id set');
  } catch (e) { FAIL(e.message); }

  // Duplicate standing cessions per supplier
  h2('suppliers with multiple standing cessions');
  try {
    const [r] = await conn.query(
      `SELECT supplier_id, COUNT(*) AS cnt FROM cession_agreements
       WHERE is_standing = 1
       GROUP BY supplier_id HAVING cnt > 1`
    );
    if (r.length > 0) {
      WARN(`${r.length} supplier(s) have multiple standing cession rows:`);
      for (const row of r) warn(`  supplier_id=${row.supplier_id} has ${row.cnt} standing cession rows`);
    } else PASS('No duplicate standing cessions');
  } catch (e) { FAIL(e.message); }

  // Invoices with no matching buyer in buyers table
  h2('invoices with invalid buyer_id');
  try {
    const [r] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM invoices i
       LEFT JOIN buyers b ON i.buyer_id = b.buyer_id
       WHERE b.buyer_id IS NULL`
    );
    if (r[0].cnt > 0) WARN(`${r[0].cnt} invoice(s) reference a buyer_id that does not exist in buyers`);
    else             PASS('All invoices reference a valid buyer');
  } catch (e) { FAIL(e.message); }

  // ── SECTION 9: migration 12 specific check ─────────────────────────────
  h1('9. Migration 12 Status (Buyer Cession Approval)');
  {
    const cols12 = await allColumns('cession_agreements');
    const names12 = cols12.map(c => c.COLUMN_NAME);

    const needed12 = ['buyer_approved_by','buyer_approved_at'];
    for (const c of needed12) {
      if (names12.includes(c)) PASS(`cession_agreements.${c} exists`);
      else                     FAIL(`cession_agreements.${c} MISSING — Migration 12 has NOT been run`);
    }

    const enumVals12 = await enumValues('cession_agreements', 'status');
    if (enumVals12 && enumVals12.includes('buyer_approved')) {
      PASS(`cession_agreements.status ENUM includes 'buyer_approved'`);
    } else {
      FAIL(`cession_agreements.status ENUM missing 'buyer_approved' — Migration 12 has NOT been run`);
    }

    const fks12 = await allFKs();
    const hasFk12 = fks12.some(fk => fk.CONSTRAINT_NAME === 'fk_cession_buyer_approved_by');
    if (hasFk12) PASS(`FK fk_cession_buyer_approved_by exists`);
    else         FAIL(`FK fk_cession_buyer_approved_by MISSING — Migration 12 has NOT been run`);

    const idxs12 = await allIndexes();
    const hasIdx12 = idxs12.some(ix => ix.TABLE_NAME === 'cession_agreements' && ix.INDEX_NAME === 'idx_cession_status_buyer');
    if (hasIdx12) PASS(`Index idx_cession_status_buyer exists`);
    else          WARN(`Index idx_cession_status_buyer MISSING — run Migration 12`);
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────
  h1('Summary');
  p('');
  p(`| | Count |`);
  p(`|--|-------|`);
  p(`| ✅ Passed | **${totalPass}** |`);
  p(`| ❌ Failed | **${totalFail}** |`);
  p(`| ⚠️  Warnings | **${totalWarn}** |`);
  p('');

  if (totalFail === 0 && totalWarn === 0) {
    p('> **All checks passed. DB schema and backend are fully aligned.**');
  } else if (totalFail === 0) {
    p(`> **No failures. ${totalWarn} warning(s) to review.**`);
  } else {
    p(`> **${totalFail} failure(s) must be resolved. See sections above.**`);
  }

  p('');
  p('---');
  p('*Report generated automatically by `scripts/db-full-report.js`*');

  await conn.end();

  // Write file
  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`\n✅ Report written to ${OUT}`);
  console.log(`   Passed: ${totalPass}  Failed: ${totalFail}  Warnings: ${totalWarn}`);

  if (totalFail > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
