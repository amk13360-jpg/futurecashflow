/**
 * Shared database configuration for utility scripts.
 * Uses environment variables — never hardcode credentials.
 *
 * Usage:
 *   const { getConnection } = require('./db-config');
 *   const conn = await getConnection();
 *
 * Required env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 * Set them in your shell or in a .env file loaded before the script.
 */
const mysql = require('mysql2/promise');

function getDbConfig() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'fmf_scf_platform';

  if (!host || !user || !password) {
    console.error(
      'ERROR: Missing required environment variables.\n' +
      'Set DB_HOST, DB_USER, DB_PASSWORD (and optionally DB_NAME) before running this script.\n' +
      'Example: DB_HOST=myserver.mysql.database.azure.com DB_USER=admin DB_PASSWORD=secret node scripts/<script>.js'
    );
    process.exit(1);
  }

  return {
    host,
    user,
    password,
    database,
    ...(host.includes('azure.com') && {
      ssl: { rejectUnauthorized: true },
    }),
  };
}

async function getConnection() {
  return mysql.createConnection(getDbConfig());
}

module.exports = { getDbConfig, getConnection };
