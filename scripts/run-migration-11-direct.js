const mysql = require("mysql2/promise")

async function run() {
  const c = await mysql.createConnection({
    host: "futurefinancecashflow.mysql.database.azure.com",
    user: "FMadmin",
    password: "REDACTED_DB_PASSWORD",
    database: "fmf_scf_platform",
    ssl: { rejectUnauthorized: true },
  })

  try {
    console.log("Connected to Azure MySQL")

    // Add each column separately; ignore 1060 "duplicate column" if already exists
    for (const [col, def] of [
      ["password_hash", "VARCHAR(255) NULL"],
      ["password_set_at", "DATETIME NULL"],
    ]) {
      try {
        await c.query(`ALTER TABLE suppliers ADD COLUMN ${col} ${def}`)
        console.log(`  + Added column: ${col}`)
      } catch (e) {
        if (e.errno === 1060) {
          console.log(`  ~ Column already exists (skipped): ${col}`)
        } else {
          throw e
        }
      }
    }
    console.log("Migration 11 applied: password_hash + password_set_at on suppliers")

    const [rows] = await c.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'fmf_scf_platform'
         AND TABLE_NAME = 'suppliers'
         AND COLUMN_NAME IN ('password_hash', 'password_set_at')`
    )
    const cols = rows.map((r) => r.COLUMN_NAME)
    if (cols.includes("password_hash") && cols.includes("password_set_at")) {
      console.log("Verified columns: password_hash, password_set_at")
    } else {
      console.error("Verification failed — found:", cols.join(", "))
    }
  } finally {
    await c.end()
  }
}

run().catch((e) => { console.error("ERR:", e.message); process.exitCode = 1 })
