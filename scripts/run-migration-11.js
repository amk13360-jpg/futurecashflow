const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../.env.local") })

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  })

  try {
    console.log("✅ Connected to database")
    const sql = fs.readFileSync(
      path.join(__dirname, "11-supplier-credentials-schema.sql"),
      "utf8"
    )
    await connection.query(sql)
    console.log("✅ Migration 11 applied: password_hash + password_set_at added to suppliers")

    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'suppliers'
         AND COLUMN_NAME IN ('password_hash', 'password_set_at')`,
      [process.env.DB_NAME]
    )
    console.log("✅ Verified columns:", rows.map((r) => r.COLUMN_NAME).join(", "))
  } finally {
    await connection.end()
  }
}

runMigration().catch((e) => {
  console.error("❌ Migration failed:", e.message)
  process.exit(1)
})
