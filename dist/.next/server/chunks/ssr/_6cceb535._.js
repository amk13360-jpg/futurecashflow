module.exports=[30782,a=>{"use strict";var b=a.i(66879);async function c(a){await (0,b.query)(`INSERT INTO audit_logs (user_id, user_type, action, entity_type, entity_id, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[a.userId||null,a.userType,a.action,a.entityType||null,a.entityId||null,a.details||null,a.ipAddress||null,a.userAgent||null])}a.s(["createAuditLog",()=>c])},19894,a=>{"use strict";var b=a.i(37936),c=a.i(66879),d=a.i(53058),e=a.i(30782);a.i(70396);var f=a.i(73727);async function g(){let a=await (0,d.getSession)();a&&"admin"===a.role||(0,f.redirect)("/login/admin");try{return await (0,c.query)(`SELECT o.offer_id, o.net_payment_amount, o.responded_at,
              i.invoice_number, i.invoice_id, i.currency,
              s.supplier_id, s.name as supplier_name, s.contact_email,
              s.bank_name, s.bank_account_no, s.bank_branch_code,
              b.name as buyer_name, b.buyer_id
       FROM offers o
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN suppliers s ON o.supplier_id = s.supplier_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       WHERE o.status = 'accepted' 
       AND NOT EXISTS (
         SELECT 1 FROM payments p WHERE p.offer_id = o.offer_id
       )
       ORDER BY o.responded_at ASC`)}catch(a){throw console.error("[v0] Error fetching payment queue:",a),a}}async function h(){let a=await (0,d.getSession)();a&&"admin"===a.role||(0,f.redirect)("/login/admin");try{return await (0,c.query)(`SELECT p.payment_id, p.amount, p.currency, p.payment_reference,
              p.status, p.scheduled_date, p.completed_date, p.batch_id,
              s.name as supplier_name, s.contact_email,
              b.name as buyer_name,
              i.invoice_number
       FROM payments p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN offers o ON p.offer_id = o.offer_id
       JOIN invoices i ON o.invoice_id = i.invoice_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       ORDER BY p.created_at DESC
       LIMIT 100`)}catch(a){throw console.error("[v0] Error fetching payments:",a),a}}async function i(a){let b=await (0,d.getSession)();if(!b||"admin"!==b.role)throw Error("Unauthorized");try{let d=await (0,c.transaction)(async c=>{let d=[],e=[];for(let f of a)try{let[a]=await c.execute(`SELECT o.*, s.supplier_id, s.bank_account_no, i.invoice_id, i.due_date
             FROM offers o
             JOIN suppliers s ON o.supplier_id = s.supplier_id
             JOIN invoices i ON o.invoice_id = i.invoice_id
             WHERE o.offer_id = ? AND o.status = 'accepted'`,[f]);if(0===a.length){e.push(`Offer ${f}: Not found or not accepted`);continue}let g=a[0],[h]=await c.execute("SELECT payment_id FROM payments WHERE offer_id = ?",[f]);if(h.length>0){e.push(`Offer ${f}: Payment already exists`);continue}let i=`FMF${Date.now()}${f}`;await c.execute(`INSERT INTO payments (offer_id, supplier_id, amount, currency, 
             payment_reference, status, scheduled_date, processed_by)
             VALUES (?, ?, ?, ?, ?, 'queued', CURDATE(), ?)`,[f,g.supplier_id,g.net_payment_amount,"ZAR",i,b.userId]),await c.execute(`INSERT INTO repayments (payment_id, buyer_id, expected_amount, due_date, status)
             SELECT LAST_INSERT_ID(), ?, ?, ?, 'pending'`,[g.buyer_id,g.net_payment_amount+g.discount_amount,g.due_date]),d.push(f)}catch(a){e.push(`Offer ${f}: ${a.message}`)}return{queued:d,errors:e}});return await (0,e.createAuditLog)({userId:b.userId,userType:"admin",action:"PAYMENTS_QUEUED",details:`Queued ${d.queued.length} payments, ${d.errors.length} errors`}),d}catch(a){throw console.error("[v0] Error queueing payments:",a),a}}async function j(a){let b=await (0,d.getSession)();if(!b||"admin"!==b.role)throw Error("Unauthorized");try{let d=`BATCH${Date.now()}`,f=await (0,c.transaction)(async b=>{let c=[];for(let e of a){let[a]=await b.execute(`SELECT p.payment_id, p.amount, p.payment_reference,
                  s.name as supplier_name, s.bank_name, s.bank_account_no, 
                  s.bank_branch_code, s.bank_account_type
           FROM payments p
           JOIN suppliers s ON p.supplier_id = s.supplier_id
           WHERE p.payment_id = ? AND p.status = 'queued'`,[e]);a.length>0&&(c.push(a[0]),await b.execute("UPDATE payments SET status = 'processing', batch_id = ? WHERE payment_id = ?",[d,e]))}return{batchId:d,payments:c}}),g=f.payments.map(a=>[a.payment_reference,a.supplier_name,a.bank_name,a.bank_account_no,a.bank_branch_code,a.bank_account_type,a.amount.toFixed(2)]),h=["Payment Reference,Beneficiary Name,Bank Name,Account Number,Branch Code,Account Type,Amount",...g.map(a=>a.join(","))].join("\n");return await (0,e.createAuditLog)({userId:b.userId,userType:"admin",action:"PAYMENT_BATCH_GENERATED",details:`Generated batch ${d} with ${f.payments.length} payments`}),{batchId:f.batchId,csvContent:h,paymentCount:f.payments.length}}catch(a){throw console.error("[v0] Error generating payment batch:",a),a}}async function k(a){let b=await (0,d.getSession)();if(!b||"admin"!==b.role)throw Error("Unauthorized");try{return await (0,c.transaction)(async b=>{for(let c of a)await b.execute("UPDATE payments SET status = 'completed', completed_date = CURDATE() WHERE payment_id = ?",[c]),await b.execute(`UPDATE invoices i
           JOIN offers o ON i.invoice_id = o.invoice_id
           JOIN payments p ON o.offer_id = p.offer_id
           SET i.status = 'paid'
           WHERE p.payment_id = ?`,[c])}),await (0,e.createAuditLog)({userId:b.userId,userType:"admin",action:"PAYMENTS_COMPLETED",details:`Marked ${a.length} payments as completed`}),{success:!0,count:a.length}}catch(a){throw console.error("[v0] Error marking payments completed:",a),a}}async function l(){let a=await (0,d.getSession)();a&&"admin"===a.role||(0,f.redirect)("/login/admin");try{return await (0,c.query)(`SELECT r.repayment_id, r.expected_amount, r.received_amount, r.due_date,
              r.received_date, r.status, r.reconciliation_reference,
              b.name as buyer_name, b.code as buyer_code,
              p.payment_reference, p.amount as payment_amount,
              s.name as supplier_name,
              i.invoice_number
       FROM repayments r
       JOIN buyers b ON r.buyer_id = b.buyer_id
       JOIN payments p ON r.payment_id = p.payment_id
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN offers o ON p.offer_id = o.offer_id
       JOIN invoices i ON o.invoice_id = i.invoice_id
       ORDER BY r.due_date ASC`)}catch(a){throw console.error("[v0] Error fetching repayments:",a),a}}async function m(a,b,f){let g=await (0,d.getSession)();if(!g||"admin"!==g.role)throw Error("Unauthorized");try{return await (0,c.transaction)(async c=>{let[d]=await c.execute("SELECT expected_amount, received_amount FROM repayments WHERE repayment_id = ?",[a]);if(0===d.length)throw Error("Repayment not found");let e=d[0],g=(e.received_amount||0)+b,h=e.expected_amount,i="partial";g>=h&&(i="completed"),await c.execute(`UPDATE repayments 
         SET received_amount = ?, received_date = CURDATE(), status = ?, 
             reconciliation_reference = ?
         WHERE repayment_id = ?`,[g,i,f,a])}),await (0,e.createAuditLog)({userId:g.userId,userType:"admin",action:"REPAYMENT_RECORDED",entityType:"repayment",entityId:a,details:`Recorded repayment of R${b}`}),{success:!0}}catch(a){throw console.error("[v0] Error recording repayment:",a),a}}(0,a.i(13095).ensureServerEntryExports)([g,h,i,j,k,l,m]),(0,b.registerServerReference)(g,"00761c4861543bd5d2a091ee296fc6ce065c974bd9",null),(0,b.registerServerReference)(h,"000dfa6f2a045c83fa4eff8a0e4f35fd5e90b3c743",null),(0,b.registerServerReference)(i,"401d63d9254b1284d8f212c5b824c3bf22c75ca834",null),(0,b.registerServerReference)(j,"40f20a5d3f484f32384beb085f9a59332d96e2ff5b",null),(0,b.registerServerReference)(k,"4091127c857255ee632ad36535f3d18f00b306dec5",null),(0,b.registerServerReference)(l,"007b039056d6eff0429be17ccd8f930907e323998f",null),(0,b.registerServerReference)(m,"7061baa7904470ac782d8edc6df3e001f17955331e",null),a.s([],8073),a.i(8073),a.s(["000dfa6f2a045c83fa4eff8a0e4f35fd5e90b3c743",()=>h,"00761c4861543bd5d2a091ee296fc6ce065c974bd9",()=>g,"007b039056d6eff0429be17ccd8f930907e323998f",()=>l,"401d63d9254b1284d8f212c5b824c3bf22c75ca834",()=>i,"4091127c857255ee632ad36535f3d18f00b306dec5",()=>k,"40f20a5d3f484f32384beb085f9a59332d96e2ff5b",()=>j],19894)}];

//# sourceMappingURL=_6cceb535._.js.map