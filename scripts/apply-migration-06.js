const fs = require('fs');
const { getConnection } = require('./db-config');
(async () => {
  try {
    const sql = fs.readFileSync(__dirname + '/06-add-payment-capture-schedule.sql', 'utf8');
    const c = await getConnection();
    console.log('Connected, running migration...');
    await c.query(sql);
    console.log('Migration applied successfully.');
    await c.end();
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
