// Vendor CSV row type for uploadVendorData
export interface VendorDataRow {
  [key: string]: string
}

// AP CSV row type for uploadAPData
export interface APDataRow {
  [key: string]: string
}
// Database type definitions

export interface Buyer {
  buyer_id: number
  name: string
  code: string
  contact_email: string
  contact_phone?: string
  active_status: "active" | "inactive" | "suspended"
  created_at: Date
  updated_at: Date
}

export interface Supplier {
  supplier_id: number
  name: string
  vat_no?: string
  registration_no?: string
  contact_person?: string
  contact_email: string
  contact_phone?: string
  physical_address?: string
  bank_name?: string
  bank_account_no?: string
  bank_branch_code?: string
  bank_account_type?: "current" | "savings" | "business"
  risk_tier: "low" | "medium" | "high"
  onboarding_status: "pending" | "documents_submitted" | "approved" | "rejected"
  approved_by?: number
  approved_at?: Date
  active_status: "active" | "inactive" | "suspended"
  password_hash?: string
  password_set_at?: Date
  created_at: Date
  updated_at: Date
}

export interface User {
  user_id: number
  username: string
  email: string
  password_hash: string
  role: "admin" | "accounts_payable" | "auditor"
  buyer_id?: number
  full_name?: string
  phone?: string
  active_status: "active" | "inactive" | "locked"
  failed_login_attempts: number
  last_login_at?: Date
  // Added by migration 05 (buyer onboarding)
  must_change_password: number
  is_email_verified: number
  activation_token?: string
  activation_token_expires?: Date
  // Added by migration 06 (security enhancements - TOTP 2FA)
  totp_secret?: string
  totp_secret_pending?: string
  totp_pending_at?: Date
  totp_enabled: boolean
  totp_backup_codes?: string
  totp_enabled_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Invoice {
  invoice_id: number
  buyer_id: number
  supplier_id: number
  invoice_number: string
  invoice_date: Date
  due_date: Date
  amount: number
  currency: string
  description?: string
  status: "pending" | "matched" | "offered" | "accepted" | "paid" | "rejected"
  uploaded_by?: number
  uploaded_at: Date
  updated_at: Date
}

export interface Offer {
  offer_id: number
  invoice_id: number
  supplier_id: number
  buyer_id: number
  annual_rate: number
  days_to_maturity: number
  discount_amount: number
  net_payment_amount: number
  offer_expiry_date: Date
  status: "sent" | "opened" | "accepted" | "rejected" | "expired"
  sent_at: Date
  opened_at?: Date
  responded_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Payment {
  payment_id: number
  offer_id: number
  supplier_id: number
  amount: number
  currency: string
  payment_reference?: string
  payment_method: "eft" | "bank_transfer" | "other"
  status: "queued" | "processing" | "completed" | "failed" | "cancelled"
  scheduled_date?: Date
  completed_date?: Date
  batch_id?: string
  processed_by?: number
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface AuditLog {
  log_id: number
  user_id?: number
  user_type: "admin" | "accounts_payable" | "supplier" | "system"
  action: string
  entity_type?: string
  entity_id?: number
  details?: string
  ip_address?: string
  user_agent?: string
  created_at: Date
}

export interface CessionAgreement {
  cession_id: number
  supplier_id: number
  document_url?: string
  document_type: "uploaded" | "digitally_signed"
  version: string
  signed_date?: Date
  signature_data?: string
  status: "pending" | "signed" | "approved" | "rejected"
  approved_by?: number
  approved_at?: Date
  created_at: Date
  updated_at: Date
}

export interface BankChangeRequest {
  request_id: number
  supplier_id: number
  old_bank_name?: string
  old_account_no?: string
  new_bank_name: string
  new_account_no: string
  new_branch_code: string
  new_account_type: "current" | "savings" | "business"
  reason?: string
  supporting_document_url?: string
  status: "pending" | "approved" | "rejected"
  reviewed_by?: number
  reviewed_at?: Date
  review_notes?: string
  created_at: Date
  updated_at: Date
}
