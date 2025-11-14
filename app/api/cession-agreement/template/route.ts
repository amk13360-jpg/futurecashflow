import { NextRequest, NextResponse } from 'next/server';
import { getSupplierAndBuyerDetails } from '@/lib/actions/suppliers';
import { generateCessionAgreementPDF } from '@/lib/utils/generateCessionAgreementPDF';

export async function GET(req: NextRequest) {
  const supplierId = req.nextUrl.searchParams.get('supplierId');
  if (!supplierId) {
    return NextResponse.json({ error: 'Missing supplierId' }, { status: 400 });
  }

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
