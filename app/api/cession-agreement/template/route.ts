import { NextRequest, NextResponse } from 'next/server';
import { getSupplierAndBuyerDetails } from '@/lib/actions/suppliers';
import { generateCessionAgreementPDF } from '@/lib/utils/generateCessionAgreementPDF';
import { getSupplierSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  // SECURITY: Get supplierId from authenticated session, not query params (prevents IDOR)
  const session = await getSupplierSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supplierId = String(session.supplierId);

  // Fetch supplier and buyer details
  const details = await getSupplierAndBuyerDetails(supplierId);
  if (!details) {
    return NextResponse.json({ error: 'Supplier or buyer not found' }, { status: 404 });
  }

  const pdfBytes = await generateCessionAgreementPDF(details);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cession-agreement.pdf"',
    },
  });
}
