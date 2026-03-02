const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin', password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform', ssl: { rejectUnauthorized: true }
  });
  console.log('Full cleanup...');
  await c.execute('DELETE FROM offers');
  await c.execute('DELETE FROM offer_batches');
  await c.execute("UPDATE invoices SET status='matched' WHERE status='offered'");
  const [inv] = await c.execute('SELECT invoice_id, invoice_number, status FROM invoices');
  console.table(inv);
  const [o] = await c.execute('SELECT COUNT(*) as cnt FROM offers');
  console.log('Offers:', o[0].cnt);
  const [b] = await c.execute('SELECT COUNT(*) as cnt FROM offer_batches');
  console.log('Batches:', b[0].cnt);
  await c.end();
  console.log('All clean!');
})().catch(e => { console.error(e); process.exit(1); });
