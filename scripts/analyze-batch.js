const mysql = require('mysql2/promise');

async function analyze() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== CREATE BATCH FLOW ANALYSIS ===\n');

  // 1. Check eligible invoices
  console.log('1. ELIGIBLE INVOICES FOR BATCHING:');
  const [invoices] = await conn.execute(`
    SELECT i.invoice_id, i.invoice_number, i.amount, i.status, 
           s.name as supplier, s.supplier_id, s.onboarding_status,
           b.name as buyer, b.code as company_code
    FROM invoices i
    JOIN suppliers s ON i.supplier_id = s.supplier_id
    JOIN buyers b ON i.buyer_id = b.buyer_id
    WHERE i.status = 'matched'
    AND s.onboarding_status = 'approved'
    ORDER BY s.supplier_id
  `);
  console.table(invoices);

  // 2. Check existing offer batches
  console.log('\n2. EXISTING OFFER BATCHES:');
  const [batches] = await conn.execute('SELECT * FROM offer_batches ORDER BY created_at DESC');
  if (batches.length === 0) {
    console.log('No offer batches exist yet.');
  } else {
    console.table(batches);
  }

  // 3. Check existing offers
  console.log('\n3. EXISTING OFFERS:');
  const [offers] = await conn.execute(`
    SELECT 
      o.offer_id,
      o.invoice_id,
      o.batch_id,
      o.annual_rate,
      o.days_to_maturity,
      o.discount_amount,
      o.net_payment_amount,
      o.status,
      o.sent_at,
      i.invoice_number
    FROM offers o
    JOIN invoices i ON o.invoice_id = i.invoice_id
    ORDER BY o.offer_id DESC
  `);
  if (offers.length === 0) {
    console.log('No offers exist yet.');
  } else {
    console.table(offers);
  }

  // 4. Check offer_batch_settings
  console.log('\n4. OFFER BATCH SETTINGS:');
  const [settings] = await conn.execute('SELECT * FROM offer_batch_settings LIMIT 1');
  if (settings.length === 0) {
    console.log('No batch settings configured.');
  } else {
    console.table(settings);
  }

  // 5. Explain the parameters
  console.log('\n' + '='.repeat(60));
  console.log('CREATE BATCH PARAMETERS EXPLANATION:');
  console.log('='.repeat(60));
  console.log(`
When you click "Create Batch" for a supplier, these parameters are sent:

┌─────────────────┬──────────────────────────────────────────────────────┐
│ Parameter       │ Description                                          │
├─────────────────┼──────────────────────────────────────────────────────┤
│ supplier_id     │ The supplier's ID (e.g., 89 for Mokwena Steel)       │
│ invoice_ids     │ Array of invoice IDs to include (e.g., [115])        │
│ send_mode       │ "review" = Review first, "email" = Send immediately  │
│ scheduledDate   │ ONLY needed if send_mode is "scheduled"              │
└─────────────────┴──────────────────────────────────────────────────────┘

WHY NULL FOR scheduledDate?
───────────────────────────
You selected "review" mode (not "scheduled"), so NO date is needed.
- "review" mode = Create batch, review offers before sending
- "email" mode = Create batch and send offers immediately
- "scheduled" mode = Create batch and send at a specific date/time

NULL means "no scheduled date" - this is CORRECT for review mode!
`);

  // 6. Show the flow
  console.log('\n' + '='.repeat(60));
  console.log('CREATE BATCH PROCESS FLOW:');
  console.log('='.repeat(60));
  console.log(`
1. You select a supplier (e.g., Mokwena Steel, supplier_id=89)
2. You check the invoices to include (e.g., invoice_id=115)
3. You select send mode (e.g., "review")
4. You click "Create Batch"

Server receives: createOfferBatch(89, [115], "review", null)
                                   │     │       │       │
                                   │     │       │       └─ scheduledDate (null = not scheduled)
                                   │     │       └─ send_mode
                                   │     └─ invoice IDs array
                                   └─ supplier_id

Server then:
  a) Creates an offer_batch record
  b) For each invoice, creates an offer with:
     - discount_rate from settings (e.g., 2.5%)
     - offer_amount = invoice_amount - discount
     - status = 'pending'
     - batch_id = the new batch ID
  c) Updates invoice status from 'matched' to 'offered'
`);

  await conn.end();
}

analyze().catch(console.error);
