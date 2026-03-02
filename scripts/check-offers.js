const { getConnection } = require('./db-config');

async function check() {
  const conn = await getConnection();

  console.log('\n=== Recent Offer Batches ===');
  const [batches] = await conn.execute(`
    SELECT ob.batch_id, ob.status, ob.sent_at, s.name, s.contact_email 
    FROM offer_batches ob 
    JOIN suppliers s ON ob.supplier_id = s.supplier_id 
    ORDER BY ob.created_at DESC 
    LIMIT 10
  `);
  console.table(batches);

  console.log('\n=== Recent Offer Access Tokens ===');
  const [tokens] = await conn.execute(`
    SELECT st.token_id, st.token_type, st.created_at, st.expires_at, st.short_code, s.name, s.contact_email 
    FROM supplier_tokens st 
    JOIN suppliers s ON st.supplier_id = s.supplier_id 
    WHERE st.token_type = 'offer_access' 
    ORDER BY st.created_at DESC 
    LIMIT 10
  `);
  console.table(tokens);

  console.log('\n=== Recent Offers ===');
  const [offers] = await conn.execute(`
    SELECT o.offer_id, o.status, o.created_at, o.sent_at, o.batch_id, s.name as supplier_name
    FROM offers o
    JOIN suppliers s ON o.supplier_id = s.supplier_id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);
  console.table(offers);

  await conn.end();
}

check().catch(e => console.error(e));
