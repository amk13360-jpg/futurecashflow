const { getConnection } = require('./db-config');

async function main() {
  const conn = await getConnection();

  console.log('=== DESCRIBE offer_batches ===');
  const [offerBatches] = await conn.execute('DESCRIBE offer_batches');
  console.table(offerBatches);

  console.log('\n=== DESCRIBE offers ===');
  const [offers] = await conn.execute('DESCRIBE offers');
  console.table(offers);

  await conn.end();
}

main().catch(err => { console.error(err); process.exitCode = 1; });
