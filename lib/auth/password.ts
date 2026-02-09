import bcrypt from "bcryptjs"
import { randomBytes, randomInt } from "crypto"

// Hash password with increased work factor for security
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12) // Increased from 10 to 12 rounds
  return bcrypt.hash(password, salt)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate cryptographically secure OTP code (6 digits)
export function generateOTP(): string {
  // Use crypto.randomInt for cryptographically secure random numbers
  return randomInt(100000, 999999).toString()
}

// Generate cryptographically secure token for supplier invites
export function generateToken(): string {
  // Use crypto.randomBytes for cryptographically secure random bytes
  return randomBytes(32).toString("hex")
}
