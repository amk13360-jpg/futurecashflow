/**
 * Payment Processing Debug Script
 * 
 * This script helps diagnose payment processing issues by showing:
 * - Current offers by status
 * - Existing payments and their status
 * - Repayments data
 * - Missing repayments for existing payments
 * 
 * Run this script to understand the current state of the payment system.
 */

const { query } = require('./db-config');
const mysql = require('mysql2/promise');

async function debugPaymentProcessing() {
  let conn;
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fmf_scf_platform',
      port: process.env.DB_PORT || 3306,
    };

    conn = await mysql.createConnection(dbConfig);

    console.log('🔍 PAYMENT PROCESSING DIAGNOSTIC REPORT\n');

    // 1. Check offers by status
    console.log('1. OFFERS BY STATUS:');
    const [offerStats] = await conn.execute(`
      SELECT status, COUNT(*) as count 
      FROM offers 
      GROUP BY status 
      ORDER BY count DESC
    `);
    if (offerStats.length === 0) {
      console.log('❌ No offers found in database');
    } else {
      console.table(offerStats);
    }

    // 2. Check accepted offers without payments
    console.log('\n2. ACCEPTED OFFERS READY FOR PAYMENT QUEUE:');
    const [paymentQueue] = await conn.execute(`
      SELECT o.offer_id, i.invoice_number, s.name as supplier_name, 
             o.net_payment_amount, o.responded_at,
             CASE 
               WHEN s.bank_account_no IS NULL OR s.bank_name IS NULL 
               THEN 'Missing bank details' 
               ELSE 'Ready' 
             END as payment_readiness
      FROM offers o
      JOIN invoices i ON o.invoice_id = i.invoice_id
      JOIN suppliers s ON o.supplier_id = s.supplier_id
      WHERE o.status = 'accepted' 
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.offer_id = o.offer_id)
      ORDER BY o.responded_at ASC
    `);
    
    if (paymentQueue.length === 0) {
      console.log('❌ No accepted offers available for payment processing');
    } else {
      console.table(paymentQueue);
    }

    // 3. Check existing payments
    console.log('\n3. EXISTING PAYMENTS:');
    const [payments] = await conn.execute(`
      SELECT p.payment_id, p.payment_reference, p.amount, p.status, 
             p.scheduled_date, s.name as supplier_name, i.invoice_number
      FROM payments p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      JOIN offers o ON p.offer_id = o.offer_id
      JOIN invoices i ON o.invoice_id = i.invoice_id
      ORDER BY p.created_at DESC
    `);
    
    if (payments.length === 0) {
      console.log('❌ No payments found in database');
    } else {
      console.table(payments);
    }

    // 4. Check repayments
    console.log('\n4. REPAYMENTS:');
    const [repayments] = await conn.execute(`
      SELECT r.repayment_id, r.payment_id, r.expected_amount, r.received_amount, 
             r.due_date, r.status, b.name as buyer_name
      FROM repayments r
      JOIN buyers b ON r.buyer_id = b.buyer_id
      ORDER BY r.due_date ASC
    `);
    
    if (repayments.length === 0) {
      console.log('❌ No repayments found in database');
    } else {
      console.table(repayments);
    }

    // 5. Check for orphaned payments (payments without repayments)
    console.log('\n5. PAYMENTS WITHOUT REPAYMENTS (DATA INTEGRITY ISSUE):');
    const [orphanedPayments] = await conn.execute(`
      SELECT p.payment_id, p.payment_reference, p.amount, p.status
      FROM payments p
      WHERE NOT EXISTS (SELECT 1 FROM repayments r WHERE r.payment_id = p.payment_id)
    `);
    
    if (orphanedPayments.length === 0) {
      console.log('✅ All payments have corresponding repayment records');
    } else {
      console.log('❌ Found payments without repayments - this indicates a bug in payment creation:');
      console.table(orphanedPayments);
      
      // Offer to fix orphaned payments
      console.log('\n🔧 RECOMMENDED ACTION:');
      console.log('Run the fix-orphaned-payments.js script to create missing repayment records.');
    }

    // 6. Summary recommendations
    console.log('\n📊 SUMMARY RECOMMENDATIONS:');
    
    const totalOffers = await conn.execute(`SELECT COUNT(*) as total FROM offers`);
    const acceptedOffers = await conn.execute(`SELECT COUNT(*) as total FROM offers WHERE status = 'accepted'`);
    const totalPayments = await conn.execute(`SELECT COUNT(*) as total FROM payments`);
    const totalRepayments = await conn.execute(`SELECT COUNT(*) as total FROM repayments`);
    
    console.log(`- Total offers: ${totalOffers[0][0].total}`);
    console.log(`- Accepted offers: ${acceptedOffers[0][0].total}`);
    console.log(`- Total payments: ${totalPayments[0][0].total}`);
    console.log(`- Total repayments: ${totalRepayments[0][0].total}`);
    
    if (paymentQueue.length === 0) {
      console.log('\n⚠️  NO PAYMENT QUEUE: Either no offers have been accepted, or all accepted offers already have payments.');
      console.log('   To fix: Accept some offers from the supplier portal or create new offer batches.');
    }
    
    if (totalRepayments[0][0].total === 0 && totalPayments[0][0].total > 0) {
      console.log('\n🚨 CRITICAL: Payments exist but no repayments - this will break the payment processing flow.');
      console.log('   To fix: Run the repayment repair script or recreate payments with the fixed code.');
    }

  } catch (error) {
    console.error('Error running diagnostic:', error);
  } finally {
    if (conn) await conn.end();
  }
}

debugPaymentProcessing().catch(console.error);