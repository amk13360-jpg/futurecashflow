const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin', password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform', ssl: { rejectUnauthorized: true }
  });
  console.log('Cleaning batch 53...');
  await conn.execute('DELETE FROM offers WHERE batch_id = 53');
  await conn.execute('DELETE FROM offer_batches WHERE batch_id = 53');
  await conn.execute("UPDATE invoices SET status = 'matched' WHERE invoice_id IN (160, 161) AND status = 'offered'");
  const [inv] = await conn.execute('SELECT invoice_id, invoice_number, status FROM invoices ORDER BY invoice_id');
  console.table(inv);
  const [off] = await conn.execute('SELECT COUNT(*) as cnt FROM offers');
  console.log('Offers:', off[0].cnt);
  const [bat] = await conn.execute('SELECT COUNT(*) as cnt FROM offer_batches');
  console.log('Batches:', bat[0].cnt);
  await conn.end();
  console.log('Done! DB is clean again.');
})().catch(e => { console.error(e); process.exit(1); });
