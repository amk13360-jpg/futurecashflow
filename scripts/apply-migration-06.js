const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  try {
    const sql = fs.readFileSync(__dirname + '/06-add-payment-capture-schedule.sql', 'utf8');
    const c = await mysql.createConnection({
      host: 'futurefinancecashflow.mysql.database.azure.com',
      user: 'FMadmin',
      password: 'REDACTED_DB_PASSWORD',
      database: 'fmf_scf_platform',
      ssl: { rejectUnauthorized: true }
    });
    console.log('Connected, running migration...');
    await c.query(sql);
    console.log('Migration applied successfully.');
    await c.end();
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
