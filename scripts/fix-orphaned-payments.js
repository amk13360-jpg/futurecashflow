/**
 * Fix Orphaned Payments Script
 * 
 * This script creates missing repayment records for payments that were created
 * before the repayment bug was fixed. This ensures data integrity and allows
 * the payment processing system to work correctly.
 */

const mysql = require('mysql2/promise');

async function fixOrphanedPayments() {
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
    await conn.beginTransaction();

    console.log('🔧 FIXING ORPHANED PAYMENTS\n');

    // Find payments without repayments
    const [orphanedPayments] = await conn.execute(`
      SELECT p.payment_id, p.offer_id, p.amount, o.buyer_id, i.due_date, o.discount_amount
      FROM payments p
      JOIN offers o ON p.offer_id = o.offer_id
      JOIN invoices i ON o.invoice_id = i.invoice_id
      WHERE NOT EXISTS (SELECT 1 FROM repayments r WHERE r.payment_id = p.payment_id)
    `);

    if (orphanedPayments.length === 0) {
      console.log('✅ No orphaned payments found - all payments have repayment records');
      await conn.rollback();
      return;
    }

    console.log(`Found ${orphanedPayments.length} orphaned payments. Creating repayment records...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const payment of orphanedPayments) {
      try {
        // Calculate expected repayment amount (payment amount + discount)
        const expectedAmount = parseFloat(payment.amount) + parseFloat(payment.discount_amount || 0);
        
        await conn.execute(`
          INSERT INTO repayments (payment_id, buyer_id, expected_amount, due_date, status)
          VALUES (?, ?, ?, ?, 'pending')
        `, [payment.payment_id, payment.buyer_id, expectedAmount, payment.due_date]);

        console.log(`✅ Created repayment for payment ID ${payment.payment_id} (Amount: ${expectedAmount})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating repayment for payment ID ${payment.payment_id}:`, error.message);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      await conn.commit();
      console.log(`\n🎉 SUCCESS: Created ${successCount} repayment records`);
      console.log('All orphaned payments have been fixed. The payment processing system should now work correctly.');
    } else {
      await conn.rollback();
      console.error(`\n❌ FAILED: ${errorCount} errors occurred. Transaction rolled back.`);
      console.error('Please check the errors above and try again.');
    }

  } catch (error) {
    console.error('Error fixing orphaned payments:', error);
    if (conn) {
      await conn.rollback();
    }
  } finally {
    if (conn) await conn.end();
  }
}

// Run the fix
fixOrphanedPayments().catch(console.error);