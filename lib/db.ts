import mysql from "mysql2/promise"

// Database configuration for localhost
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "fmf_scf_platform",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL configuration for Azure MySQL
  ...(process.env.DB_HOST?.includes('azure.com') && {
    ssl: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  }),
}

// Create connection pool
let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

// Helper function to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    // FIX: Ensure params is always an array, never undefined
    const [results] = await connection.execute(sql, params || [])
    return results as T
  } finally {
    connection.release()
  }
}

// Helper function for transactions
import type { PoolConnection } from "mysql2/promise"
export async function transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection()
    await connection.ping()
    connection.release()
    return true
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    return false
  }
}