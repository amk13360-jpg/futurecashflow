const mysql = require('mysql2/promise');
const fs = require('fs');

async function extractSchema() {
  const conn = await mysql.createConnection({
    host: 'futurefinancecashflow.mysql.database.azure.com',
    user: 'FMadmin',
    password: 'REDACTED_DB_PASSWORD',
    database: 'fmf_scf_platform',
    ssl: { rejectUnauthorized: true }
  });

  let sql = '-- =====================================================\n';
  sql += '-- Database Schema Export: fmf_scf_platform\n';
  sql += '-- Azure MySQL: futurefinancecashflow.mysql.database.azure.com\n';
  sql += '-- Exported on: ' + new Date().toISOString() + '\n';
  sql += '-- =====================================================\n\n';
  sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
  sql += 'SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE=\'TRADITIONAL\';\n\n';

  // Get all tables
  const [tables] = await conn.execute('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  
  console.log(`Extracting schema for ${tableNames.length} tables...`);

  for (const tableName of tableNames) {
    console.log(`  - ${tableName}`);
    const [createTable] = await conn.execute(`SHOW CREATE TABLE \`${tableName}\``);
    sql += '-- -----------------------------------------------------\n';
    sql += `-- Table: ${tableName}\n`;
    sql += '-- -----------------------------------------------------\n';
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sql += createTable[0]['Create Table'] + ';\n\n';
  }

  sql += '\nSET SQL_MODE=@OLD_SQL_MODE;\n';
  sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  const outputPath = 'scripts/database-schema.sql';
  fs.writeFileSync(outputPath, sql);
  console.log(`\nSchema exported to ${outputPath}`);
  console.log(`Total tables: ${tableNames.length}`);
  
  await conn.end();
}

extractSchema().catch(console.error);
