'use server';

import { query, transaction } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/auth/audit';
import { createUserForBuyer } from '@/lib/actions/buyer-users';

// ============================================================================
// Types
// ============================================================================

export interface Buyer {
  buyer_id: number;
  name: string;
  trading_name: string | null;
  registration_no: string | null;
  tax_id: string | null;
  industry_sector: 'mining' | 'manufacturing' | 'retail' | 'construction' | 'agriculture' | 'services' | 'other';
  risk_tier: 'A' | 'B' | 'C';
  physical_address_street: string | null;
  physical_address_city: string | null;
  physical_address_province: string | null;
  physical_address_postal: string | null;
  primary_contact_name: string | null;
  code: string;
  contact_email: string;
  contact_phone: string | null;
  financial_contact_name: string | null;
  financial_contact_email: string | null;
  min_invoice_amount: number;
  max_invoice_amount: number;
  min_days_to_maturity: number;
  max_days_to_maturity: number;
  credit_limit: number | null;
  current_exposure: number;
  rate_card_id: number | null;
  created_by: number | null;
  approved_by: number | null;
  approved_at: Date | null;
  active_status: 'draft' | 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface BuyerWithStats extends Buyer {
  ap_user_count: number;
  supplier_count: number;
  invoice_count: number;
  total_financed: number;
  rate_card_name: string | null;
}

export interface CreateBuyerInput {
  name: string;
  trading_name?: string;
  code: string;
  registration_no?: string;
  tax_id?: string;
  industry_sector?: 'mining' | 'manufacturing' | 'retail' | 'construction' | 'agriculture' | 'services' | 'other';
  risk_tier?: 'A' | 'B' | 'C';
  physical_address_street?: string;
  physical_address_city?: string;
  physical_address_province?: string;
  physical_address_postal?: string;
  primary_contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  financial_contact_name?: string;
  financial_contact_email?: string;
  min_invoice_amount?: number;
  max_invoice_amount?: number;
  min_days_to_maturity?: number;
  max_days_to_maturity?: number;
  credit_limit?: number;
  rate_card_id?: number;
  active_status?: 'draft' | 'active';
}

export interface UpdateBuyerInput extends Partial<CreateBuyerInput> {
  buyer_id: number;
}

export interface RateCard {
  rate_card_id: number;
  name: string;
  description: string | null;
  base_annual_rate: number;
  tier_a_adjustment: number;
  tier_b_adjustment: number;
  tier_c_adjustment: number;
  days_brackets: any;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
}

// ============================================================================
// Get All Buyers
// ============================================================================

export async function getBuyers(filters?: {
  status?: 'draft' | 'active' | 'inactive' | 'suspended';
  risk_tier?: 'A' | 'B' | 'C';
  industry_sector?: string;
  search?: string;
}): Promise<{ success: boolean; data?: BuyerWithStats[]; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    let sql = `
      SELECT 
        b.*,
        rc.name as rate_card_name,
        (SELECT COUNT(*) FROM users u WHERE u.buyer_id = b.buyer_id AND u.role = 'accounts_payable') as ap_user_count,
        (SELECT COUNT(DISTINCT i.supplier_id) FROM invoices i WHERE i.buyer_id = b.buyer_id) as supplier_count,
        (SELECT COUNT(*) FROM invoices i WHERE i.buyer_id = b.buyer_id) as invoice_count,
        COALESCE((SELECT SUM(p.amount) FROM payments p 
          JOIN offers o ON p.offer_id = o.offer_id 
          JOIN invoices i ON o.invoice_id = i.invoice_id 
          WHERE i.buyer_id = b.buyer_id), 0) as total_financed
      FROM buyers b
      LEFT JOIN rate_cards rc ON b.rate_card_id = rc.rate_card_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND b.active_status = ?';
      params.push(filters.status);
    }

    if (filters?.risk_tier) {
      sql += ' AND b.risk_tier = ?';
      params.push(filters.risk_tier);
    }

    if (filters?.industry_sector) {
      sql += ' AND b.industry_sector = ?';
      params.push(filters.industry_sector);
    }

    if (filters?.search) {
      sql += ' AND (b.name LIKE ? OR b.code LIKE ? OR b.contact_email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY b.name ASC';

    const buyers = await query(sql, params) as BuyerWithStats[];

    return { success: true, data: buyers };
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return { success: false, message: 'Failed to fetch buyers' };
  }
}

// ============================================================================
// Get Single Buyer
// ============================================================================

export async function getBuyerById(buyerId: number): Promise<{ success: boolean; data?: BuyerWithStats; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    const sql = `
      SELECT 
        b.*,
        rc.name as rate_card_name,
        (SELECT COUNT(*) FROM users u WHERE u.buyer_id = b.buyer_id AND u.role = 'accounts_payable') as ap_user_count,
        (SELECT COUNT(DISTINCT i.supplier_id) FROM invoices i WHERE i.buyer_id = b.buyer_id) as supplier_count,
        (SELECT COUNT(*) FROM invoices i WHERE i.buyer_id = b.buyer_id) as invoice_count,
        COALESCE((SELECT SUM(p.amount) FROM payments p 
          JOIN offers o ON p.offer_id = o.offer_id 
          JOIN invoices i ON o.invoice_id = i.invoice_id 
          WHERE i.buyer_id = b.buyer_id), 0) as total_financed
      FROM buyers b
      LEFT JOIN rate_cards rc ON b.rate_card_id = rc.rate_card_id
      WHERE b.buyer_id = ?
    `;

    const buyers = await query(sql, [buyerId]) as BuyerWithStats[];

    if (buyers.length === 0) {
      return { success: false, message: 'Buyer not found' };
    }

    return { success: true, data: buyers[0] };
  } catch (error) {
    console.error('Error fetching buyer:', error);
    return { success: false, message: 'Failed to fetch buyer' };
  }
}

// ============================================================================
// Create Buyer
// ============================================================================

export async function createBuyer(input: CreateBuyerInput): Promise<{ success: boolean; buyerId?: number; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Check for duplicate code
    const existing = await query(
      'SELECT buyer_id FROM buyers WHERE code = ?',
      [input.code]
    ) as any[];

    if (existing.length > 0) {
      return { success: false, message: 'A buyer with this code already exists' };
    }

    // Get default rate card if not specified
    let rateCardId = input.rate_card_id;
    if (!rateCardId) {
      const defaultCard = await query(
        'SELECT rate_card_id FROM rate_cards WHERE is_default = 1 LIMIT 1'
      ) as any[];
      if (defaultCard.length > 0) {
        rateCardId = defaultCard[0].rate_card_id;
      }
    }

    const sql = `
      INSERT INTO buyers (
        name, trading_name, code, registration_no, tax_id,
        industry_sector, risk_tier,
        physical_address_street, physical_address_city, physical_address_province, physical_address_postal,
        primary_contact_name, contact_email, contact_phone,
        financial_contact_name, financial_contact_email,
        min_invoice_amount, max_invoice_amount, min_days_to_maturity, max_days_to_maturity,
        credit_limit, rate_card_id, created_by, active_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      input.name,
      input.trading_name || null,
      input.code,
      input.registration_no || null,
      input.tax_id || null,
      input.industry_sector || 'mining',
      input.risk_tier || 'B',
      input.physical_address_street || null,
      input.physical_address_city || null,
      input.physical_address_province || null,
      input.physical_address_postal || null,
      input.primary_contact_name || null,
      input.contact_email,
      input.contact_phone || null,
      input.financial_contact_name || null,
      input.financial_contact_email || null,
      input.min_invoice_amount || 1000.00,
      input.max_invoice_amount || 5000000.00,
      input.min_days_to_maturity || 7,
      input.max_days_to_maturity || 90,
      input.credit_limit || null,
      rateCardId || null,
      session.userId,
      input.active_status || 'active'
    ]) as any;

    const buyerId = result.insertId;

    let welcomeMessage: string | undefined;

    if (input.contact_email) {
      try {
        const username = await generateUniqueUsername(
          input.contact_email.split('@')[0] || '',
          input.code,
          buyerId
        );

        const apUserResult = await createUserForBuyer({
          buyer_id: buyerId,
          username,
          email: input.contact_email,
          full_name: input.primary_contact_name || input.name,
          phone: input.contact_phone,
          send_welcome_email: true
        });

        if (!apUserResult.success) {
          await query('DELETE FROM buyers WHERE buyer_id = ?', [buyerId]);
          return {
            success: false,
            message: apUserResult.message
              ? `Failed to create AP user for buyer: ${apUserResult.message}`
              : 'Failed to create AP user for buyer'
          };
        }

        welcomeMessage = apUserResult.message;
      } catch (userError) {
        console.error('Error creating default AP user for buyer:', userError);
        await query('DELETE FROM buyers WHERE buyer_id = ?', [buyerId]);
        return { success: false, message: 'Failed to create AP user for buyer' };
      }
    }

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'CREATE_BUYER',
      entityType: 'buyer',
      entityId: buyerId,
      details: JSON.stringify({ name: input.name, code: input.code, status: input.active_status || 'draft' })
    });

    revalidatePath('/admin/buyers');

    const messageParts = ['Buyer created successfully.'];
    if (welcomeMessage) {
      messageParts.push(welcomeMessage);
    } else if (!input.contact_email) {
      messageParts.push('No AP user was created because a primary contact email was not provided.');
    }

    return { success: true, buyerId, message: messageParts.join(' ') };
  } catch (error) {
    console.error('Error creating buyer:', error);
    return { success: false, message: 'Failed to create buyer' };
  }
}

// Generate a candidate username based on contact details and ensure it is unique.
async function generateUniqueUsername(emailPrefix: string, buyerCode: string, buyerId: number): Promise<string> {
  const sanitize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const candidates: string[] = [];
  const prefix = sanitize(emailPrefix);
  if (prefix.length >= 3) {
    candidates.push(prefix);
  }

  const codeCandidate = sanitize(buyerCode);
  if (codeCandidate.length >= 3) {
    candidates.push(codeCandidate);
  }

  candidates.push(`buyer${buyerId}`);

  for (const base of candidates) {
    const username = await ensureUniqueUsername(base);
    if (username) {
      return username;
    }
  }

  return ensureUniqueUsername(`buyer${buyerId}`);
}

// Append an incrementing numeric suffix until the username no longer exists.
async function ensureUniqueUsername(base: string): Promise<string> {
  const trimmedBase = base.slice(0, 24) || 'buyer';
  let candidate = trimmedBase;
  let suffix = 0;

  while (true) {
    const existing = await query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [candidate]) as any[];
    if (existing.length === 0) {
      return candidate;
    }
    suffix += 1;
    const suffixStr = String(suffix);
    const maxBaseLength = Math.max(1, 30 - suffixStr.length);
    candidate = `${trimmedBase.slice(0, maxBaseLength)}${suffixStr}`;
  }
}

// ============================================================================
// Update Buyer
// ============================================================================

export async function updateBuyer(input: UpdateBuyerInput): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Get current buyer data for change logging
    const currentBuyer = await query(
      'SELECT * FROM buyers WHERE buyer_id = ?',
      [input.buyer_id]
    ) as Buyer[];

    if (currentBuyer.length === 0) {
      return { success: false, message: 'Buyer not found' };
    }

    // Check for duplicate code if changing
    if (input.code && input.code !== currentBuyer[0].code) {
      const existing = await query(
        'SELECT buyer_id FROM buyers WHERE code = ? AND buyer_id != ?',
        [input.code, input.buyer_id]
      ) as any[];

      if (existing.length > 0) {
        return { success: false, message: 'A buyer with this code already exists' };
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];

    const fields: (keyof CreateBuyerInput)[] = [
      'name', 'trading_name', 'code', 'registration_no', 'tax_id',
      'industry_sector', 'risk_tier',
      'physical_address_street', 'physical_address_city', 'physical_address_province', 'physical_address_postal',
      'primary_contact_name', 'contact_email', 'contact_phone',
      'financial_contact_name', 'financial_contact_email',
      'min_invoice_amount', 'max_invoice_amount', 'min_days_to_maturity', 'max_days_to_maturity',
      'credit_limit', 'rate_card_id', 'active_status'
    ];

    // Critical fields that require approval workflow (future enhancement)
    const criticalFields = ['name', 'tax_id', 'risk_tier'];

    for (const field of fields) {
      if (input[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(input[field]);

        // Log change for critical fields
        if (criticalFields.includes(field)) {
          const oldValue = String(currentBuyer[0][field as keyof Buyer] || '');
          const newValue = String(input[field] || '');
          if (oldValue !== newValue) {
            await query(
              `INSERT INTO buyer_change_log (buyer_id, field_name, old_value, new_value, changed_by, requires_approval)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [input.buyer_id, field, oldValue, newValue, session.userId, false]
            );
          }
        }
      }
    }

    if (updateFields.length === 0) {
      return { success: false, message: 'No fields to update' };
    }

    params.push(input.buyer_id);

    await query(
      `UPDATE buyers SET ${updateFields.join(', ')}, updated_at = NOW() WHERE buyer_id = ?`,
      params
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'UPDATE_BUYER',
      entityType: 'buyer',
      entityId: input.buyer_id,
      details: JSON.stringify({ fields: Object.keys(input).filter(k => k !== 'buyer_id') })
    });

    revalidatePath('/admin/buyers');
    revalidatePath(`/admin/buyers/${input.buyer_id}`);
    return { success: true, message: 'Buyer updated successfully' };
  } catch (error) {
    console.error('Error updating buyer:', error);
    return { success: false, message: 'Failed to update buyer' };
  }
}

// ============================================================================
// Activate Buyer (from Draft status)
// ============================================================================

export async function activateBuyer(buyerId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Get current buyer
    const buyers = await query(
      'SELECT * FROM buyers WHERE buyer_id = ?',
      [buyerId]
    ) as Buyer[];

    if (buyers.length === 0) {
      return { success: false, message: 'Buyer not found' };
    }

    const buyer = buyers[0];

    // Validate required fields before activation
    const requiredFields = ['name', 'code', 'contact_email'];
    const missingFields = requiredFields.filter(f => !buyer[f as keyof Buyer]);
    
    if (missingFields.length > 0) {
      return { success: false, message: `Missing required fields: ${missingFields.join(', ')}` };
    }

    await query(
      `UPDATE buyers SET 
        active_status = 'active', 
        approved_by = ?, 
        approved_at = NOW(),
        updated_at = NOW()
       WHERE buyer_id = ?`,
      [session.userId, buyerId]
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'ACTIVATE_BUYER',
      entityType: 'buyer',
      entityId: buyerId,
      details: JSON.stringify({ name: buyer.name })
    });

    revalidatePath('/admin/buyers');
    return { success: true, message: 'Buyer activated successfully' };
  } catch (error) {
    console.error('Error activating buyer:', error);
    return { success: false, message: 'Failed to activate buyer' };
  }
}

// ============================================================================
// Suspend Buyer
// ============================================================================

export async function suspendBuyer(buyerId: number, reason: string): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    await query(
      `UPDATE buyers SET active_status = 'suspended', updated_at = NOW() WHERE buyer_id = ?`,
      [buyerId]
    );

    // Log the suspension with reason
    await query(
      `INSERT INTO buyer_change_log (buyer_id, field_name, old_value, new_value, change_reason, changed_by)
       VALUES (?, 'active_status', 'active', 'suspended', ?, ?)`,
      [buyerId, reason, session.userId]
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'SUSPEND_BUYER',
      entityType: 'buyer',
      entityId: buyerId,
      details: JSON.stringify({ reason })
    });

    revalidatePath('/admin/buyers');
    return { success: true, message: 'Buyer suspended' };
  } catch (error) {
    console.error('Error suspending buyer:', error);
    return { success: false, message: 'Failed to suspend buyer' };
  }
}

// ============================================================================
// Get Buyer AP Users
// ============================================================================

export async function getBuyerUsers(buyerId: number): Promise<{ success: boolean; data?: any[]; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    const users = await query(
      `SELECT user_id, username, email, full_name, phone, role, active_status, 
              must_change_password, is_email_verified, last_login_at, created_at
       FROM users 
       WHERE buyer_id = ? 
       ORDER BY role, username`,
      [buyerId]
    );

    return { success: true, data: users as any[] };
  } catch (error) {
    console.error('Error fetching buyer users:', error);
    return { success: false, message: 'Failed to fetch users' };
  }
}

// ============================================================================
// Get Buyer Stats
// ============================================================================

export async function getBuyerStats(buyerId: number): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM invoices WHERE buyer_id = ?) as total_invoices,
        (SELECT SUM(amount) FROM invoices WHERE buyer_id = ?) as total_invoice_value,
        (SELECT COUNT(*) FROM invoices WHERE buyer_id = ? AND status = 'matched') as matched_invoices,
        (SELECT COUNT(*) FROM offers o JOIN invoices i ON o.invoice_id = i.invoice_id WHERE i.buyer_id = ?) as total_offers,
        (SELECT COUNT(*) FROM offers o JOIN invoices i ON o.invoice_id = i.invoice_id WHERE i.buyer_id = ? AND o.status = 'accepted') as accepted_offers,
        (SELECT COUNT(*) FROM suppliers WHERE buyer_id = ?) as total_suppliers,
        (SELECT COUNT(*) FROM suppliers WHERE buyer_id = ? AND onboarding_status = 'completed') as active_suppliers,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p 
          JOIN offers o ON p.offer_id = o.offer_id 
          JOIN invoices i ON o.invoice_id = i.invoice_id 
          WHERE i.buyer_id = ?) as total_financed,
        (SELECT COUNT(*) FROM users WHERE buyer_id = ? AND role = 'accounts_payable') as ap_users
    `, [buyerId, buyerId, buyerId, buyerId, buyerId, buyerId, buyerId, buyerId, buyerId]);

    return { success: true, data: (stats as any[])[0] };
  } catch (error) {
    console.error('Error fetching buyer stats:', error);
    return { success: false, message: 'Failed to fetch stats' };
  }
}

// ============================================================================
// Get Rate Cards
// ============================================================================

export async function getRateCards(): Promise<{ success: boolean; data?: RateCard[]; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCards = await query(
      'SELECT * FROM rate_cards WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
    ) as RateCard[];

    return { success: true, data: rateCards };
  } catch (error) {
    console.error('Error fetching rate cards:', error);
    return { success: false, message: 'Failed to fetch rate cards' };
  }
}

// ============================================================================
// Get Buyer Documents
// ============================================================================

export async function getBuyerDocuments(buyerId: number): Promise<{ success: boolean; data?: any[]; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    const documents = await query(
      `SELECT bd.*, u.full_name as uploaded_by_name
       FROM buyer_documents bd
       LEFT JOIN users u ON bd.uploaded_by = u.user_id
       WHERE bd.buyer_id = ?
       ORDER BY bd.uploaded_at DESC`,
      [buyerId]
    );

    return { success: true, data: documents as any[] };
  } catch (error) {
    console.error('Error fetching buyer documents:', error);
    return { success: false, message: 'Failed to fetch documents' };
  }
}

// ============================================================================
// Get Buyer Change Log
// ============================================================================

export async function getBuyerChangeLog(buyerId: number): Promise<{ success: boolean; data?: any[]; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    const logs = await query(
      `SELECT bcl.*, u.full_name as changed_by_name, u2.full_name as approved_by_name
       FROM buyer_change_log bcl
       LEFT JOIN users u ON bcl.changed_by = u.user_id
       LEFT JOIN users u2 ON bcl.approved_by = u2.user_id
       WHERE bcl.buyer_id = ?
       ORDER BY bcl.changed_at DESC
       LIMIT 50`,
      [buyerId]
    );

    return { success: true, data: logs as any[] };
  } catch (error) {
    console.error('Error fetching change log:', error);
    return { success: false, message: 'Failed to fetch change log' };
  }
}

// ============================================================================
// Calculate Effective Rate for Buyer
// ============================================================================

export async function calculateEffectiveRate(
  buyerId: number, 
  daysToMaturity: number
): Promise<{ success: boolean; rate?: number; breakdown?: any; message?: string }> {
  try {
    // Get buyer with rate card
    const buyers = await query(`
      SELECT b.risk_tier, rc.*
      FROM buyers b
      LEFT JOIN rate_cards rc ON b.rate_card_id = rc.rate_card_id
      WHERE b.buyer_id = ?
    `, [buyerId]) as any[];

    if (buyers.length === 0) {
      return { success: false, message: 'Buyer not found' };
    }

    const buyer = buyers[0];
    let baseRate = buyer.base_annual_rate || 18.00;

    // Apply tier adjustment
    let tierAdjustment = 0;
    switch (buyer.risk_tier) {
      case 'A':
        tierAdjustment = buyer.tier_a_adjustment || -2.00;
        break;
      case 'B':
        tierAdjustment = buyer.tier_b_adjustment || 0;
        break;
      case 'C':
        tierAdjustment = buyer.tier_c_adjustment || 3.00;
        break;
    }

    // Apply days bracket adjustment (if configured)
    let daysAdjustment = 0;
    if (buyer.days_brackets) {
      const brackets = typeof buyer.days_brackets === 'string' 
        ? JSON.parse(buyer.days_brackets) 
        : buyer.days_brackets;
      
      for (const bracket of brackets) {
        if (daysToMaturity >= bracket.min && daysToMaturity <= bracket.max) {
          daysAdjustment = bracket.rate_adj || 0;
          break;
        }
      }
    }

    const effectiveRate = baseRate + tierAdjustment + daysAdjustment;

    return {
      success: true,
      rate: effectiveRate,
      breakdown: {
        baseRate,
        tierAdjustment,
        daysAdjustment,
        riskTier: buyer.risk_tier,
        daysToMaturity
      }
    };
  } catch (error) {
    console.error('Error calculating rate:', error);
    return { success: false, message: 'Failed to calculate rate' };
  }
}

// ============================================================================
// Check if buyer has approved suppliers (for AP dashboard)
// ============================================================================

export async function hasApprovedSuppliers(): Promise<{ hasApproved: boolean; approvedCount: number; totalCount: number }> {
  try {
    const session = await getSession();
    if (!session) {
      return { hasApproved: false, approvedCount: 0, totalCount: 0 };
    }

    let buyerId = session.buyerId;
    
    // If admin, check all suppliers
    if (session.role === 'admin') {
      const result = await query<any[]>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN onboarding_status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM suppliers
      `);
      const data = result[0] || { total: 0, approved: 0 };
      return { 
        hasApproved: data.approved > 0, 
        approvedCount: Number(data.approved) || 0, 
        totalCount: Number(data.total) || 0 
      };
    }
    
    // For AP users, check their buyer's suppliers
    if (!buyerId) {
      return { hasApproved: false, approvedCount: 0, totalCount: 0 };
    }

    const result = await query<any[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN onboarding_status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM suppliers
      WHERE buyer_id = ?
    `, [buyerId]);
    
    const data = result[0] || { total: 0, approved: 0 };
    return { 
      hasApproved: data.approved > 0, 
      approvedCount: Number(data.approved) || 0, 
      totalCount: Number(data.total) || 0 
    };
  } catch (error) {
    console.error('Error checking approved suppliers:', error);
    return { hasApproved: false, approvedCount: 0, totalCount: 0 };
  }
}
