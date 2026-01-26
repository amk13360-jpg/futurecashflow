const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== DESCRIBE offer_batches ===');
  const [offerBatches] = await conn.execute('DESCRIBE offer_batches');
  console.table(offerBatches);

  console.log('\n=== DESCRIBE offers ===');
  const [offers] = await conn.execute('DESCRIBE offers');
  console.table(offers);

  await conn.end();
}

main().catch(err => { console.error(err); process.exitCode = 1; });
