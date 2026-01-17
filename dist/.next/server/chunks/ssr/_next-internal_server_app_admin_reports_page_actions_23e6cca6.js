module.exports=[87169,a=>{"use strict";var b=a.i(37936),c=a.i(66879),d=a.i(53058);a.i(70396);var e=a.i(73727);async function f(a){let b=await (0,d.getSession)();b&&"admin"===b.role||(0,e.redirect)("/login/admin");try{let b=`
      SELECT 
        DATE(o.sent_at) as date,
        b.name as buyer_name,
        s.name as supplier_name,
        COUNT(*) as total_offers,
        SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) as accepted_offers,
        SUM(CASE WHEN o.status = 'rejected' THEN 1 ELSE 0 END) as rejected_offers,
        SUM(CASE WHEN o.status = 'expired' THEN 1 ELSE 0 END) as expired_offers,
        SUM(o.net_payment_amount) as total_value,
        SUM(CASE WHEN o.status = 'accepted' THEN o.net_payment_amount ELSE 0 END) as accepted_value
      FROM offers o
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN suppliers s ON o.supplier_id = s.supplier_id
      WHERE 1=1
    `,d=[];return a?.startDate&&(b+=" AND o.sent_at >= ?",d.push(a.startDate)),a?.endDate&&(b+=" AND o.sent_at <= ?",d.push(a.endDate)),a?.buyerId&&(b+=" AND o.buyer_id = ?",d.push(a.buyerId)),a?.supplierId&&(b+=" AND o.supplier_id = ?",d.push(a.supplierId)),b+=" GROUP BY DATE(o.sent_at), b.name, s.name ORDER BY date DESC",await (0,c.query)(b,d)}catch(a){throw console.error("[v0] Error fetching offer acceptance summary:",a),a}}async function g(a){let b=await (0,d.getSession)();b&&"admin"===b.role||(0,e.redirect)("/login/admin");try{let b=`
      SELECT 
        p.payment_id,
        p.payment_reference,
        p.batch_id,
        p.amount,
        p.currency,
        p.status,
        p.scheduled_date,
        p.completed_date,
        s.name as supplier_name,
        s.bank_name,
        s.bank_account_no,
        b.name as buyer_name,
        i.invoice_number,
        u.full_name as processed_by_name
      FROM payments p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      JOIN offers o ON p.offer_id = o.offer_id
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN invoices i ON o.invoice_id = i.invoice_id
      LEFT JOIN users u ON p.processed_by = u.user_id
      WHERE 1=1
    `,d=[];return a?.startDate&&(b+=" AND p.scheduled_date >= ?",d.push(a.startDate)),a?.endDate&&(b+=" AND p.scheduled_date <= ?",d.push(a.endDate)),a?.status&&(b+=" AND p.status = ?",d.push(a.status)),b+=" ORDER BY p.scheduled_date DESC, p.payment_id DESC",await (0,c.query)(b,d)}catch(a){throw console.error("[v0] Error fetching disbursement tracker:",a),a}}async function h(){let a=await (0,d.getSession)();a&&"admin"===a.role||(0,e.redirect)("/login/admin");try{return await (0,c.query)(`
      SELECT 
        s.supplier_id,
        s.vendor_number,
        s.name,
        s.vat_no,
        s.contact_email,
        s.contact_phone,
        s.onboarding_status,
        s.active_status,
        s.bank_name,
        s.bank_account_no,
        s.created_at,
        s.approved_at,
        COUNT(DISTINCT i.invoice_id) as invoice_count,
        COUNT(DISTINCT o.offer_id) as offer_count,
        SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) as accepted_offers,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_disbursed,
        MAX(ca.status) as cession_status,
        MAX(ca.signed_date) as cession_signed_date
      FROM suppliers s
      LEFT JOIN invoices i ON s.vendor_number = i.vendor_number AND s.company_code = i.company_code
      LEFT JOIN offers o ON s.supplier_id = o.supplier_id
      LEFT JOIN payments p ON o.offer_id = p.offer_id
      LEFT JOIN cession_agreements ca ON s.supplier_id = ca.supplier_id
      GROUP BY 
        s.supplier_id,
        s.vendor_number,
        s.name,
        s.vat_no,
        s.contact_email,
        s.contact_phone,
        s.onboarding_status,
        s.active_status,
        s.bank_name,
        s.bank_account_no,
        s.created_at,
        s.approved_at
      ORDER BY s.created_at DESC
    `)}catch(a){throw console.error("[v0] Error fetching supplier status report:",a),a}}async function i(a){let b=await (0,d.getSession)();b&&"admin"===b.role||(0,e.redirect)("/login/admin");try{let b=100;if(a?.limit!==void 0&&a?.limit!==null){let c=parseInt(String(a.limit),10);!isNaN(c)&&c>0&&(b=c)}let d=`
      SELECT 
        a.log_id,
        a.user_id,
        a.user_type,
        a.action,
        a.entity_type,
        a.entity_id,
        a.details,
        a.ip_address,
        a.created_at,
        u.username,
        u.full_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE 1=1
    `,e=[];return a?.startDate&&(d+=" AND a.created_at >= ?",e.push(a.startDate)),a?.endDate&&(d+=" AND a.created_at <= ?",e.push(a.endDate)),a?.userId&&(d+=" AND a.user_id = ?",e.push(a.userId)),a?.action&&(d+=" AND a.action LIKE ?",e.push(`%${a.action}%`)),d+=` ORDER BY a.created_at DESC LIMIT ${b}`,await (0,c.query)(d,e)}catch(a){throw console.error("[v0] Error fetching audit history:",a),a}}async function j(){let a=await (0,d.getSession)();a&&"admin"===a.role||(0,e.redirect)("/login/admin");try{return(await (0,c.query)(`
      SELECT 
        (SELECT COUNT(*) FROM suppliers WHERE active_status = 'active') as active_suppliers,
        (SELECT COUNT(*) FROM suppliers WHERE onboarding_status = 'pending') as pending_suppliers,
        (SELECT COUNT(*) FROM invoices WHERE status = 'matched') as matched_invoices,
        (SELECT COUNT(*) FROM offers WHERE status = 'sent') as pending_offers,
        (SELECT COUNT(*) FROM offers WHERE status = 'accepted') as accepted_offers,
        (SELECT COUNT(*) FROM payments WHERE status = 'queued') as queued_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
        (SELECT SUM(amount) FROM payments WHERE status = 'completed') as total_disbursed,
        (SELECT COUNT(*) FROM repayments WHERE status = 'pending') as pending_repayments,
        (SELECT COUNT(*) FROM repayments WHERE status = 'overdue') as overdue_repayments,
        (SELECT COUNT(*) FROM bank_change_requests WHERE status = 'pending') as pending_bank_changes,
        (SELECT COUNT(*) FROM cession_agreements WHERE status = 'pending') as pending_cessions
    `))[0]}catch(a){throw console.error("[v0] Error fetching system statistics:",a),a}}async function k(a,b){let c=await (0,d.getSession)();if(!c||"admin"!==c.role)throw Error("Unauthorized");try{if(0===b.length)throw Error("No data to export");let c=Object.keys(b[0]),d=b.map(a=>c.map(b=>JSON.stringify(a[b]||"")).join(",")),e=[c.join(","),...d].join("\n");return{filename:`${a}_${new Date().toISOString().split("T")[0]}.csv`,content:e}}catch(a){throw console.error("[v0] Error exporting report:",a),a}}(0,a.i(13095).ensureServerEntryExports)([f,g,h,i,j,k]),(0,b.registerServerReference)(f,"4041d4f0f0f82d2588df0a17ceae54d73003b2d92b",null),(0,b.registerServerReference)(g,"40e60838d1c9301be03b4a34080e00e30752d462cf",null),(0,b.registerServerReference)(h,"00393ab2bb2a82c8fa7254e1f05ef551c22e32071b",null),(0,b.registerServerReference)(i,"4053b3da884a8dcf386432101e833a968ba7e7f12e",null),(0,b.registerServerReference)(j,"00bb621a689d5f157f926b81d4ed689b55053fa0be",null),(0,b.registerServerReference)(k,"6008dcd9ce67f2d085b54a1d14f08f6d1b7d75aec3",null),a.s([],30187),a.i(30187),a.s(["00393ab2bb2a82c8fa7254e1f05ef551c22e32071b",()=>h,"00bb621a689d5f157f926b81d4ed689b55053fa0be",()=>j,"4041d4f0f0f82d2588df0a17ceae54d73003b2d92b",()=>f,"4053b3da884a8dcf386432101e833a968ba7e7f12e",()=>i,"40e60838d1c9301be03b4a34080e00e30752d462cf",()=>g,"6008dcd9ce67f2d085b54a1d14f08f6d1b7d75aec3",()=>k],87169)}];

//# sourceMappingURL=_next-internal_server_app_admin_reports_page_actions_23e6cca6.js.map