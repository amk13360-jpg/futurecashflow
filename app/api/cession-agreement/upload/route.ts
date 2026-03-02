import { NextRequest, NextResponse } from 'next/server';
import { uploadCessionAgreement } from '@/lib/actions/suppliers';
import { getSupplierSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSupplierSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Server-side file validation
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Invalid file type. Only PDF files are accepted.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate PDF magic bytes (%PDF-)
  const pdfMagic = buffer.subarray(0, 5).toString('ascii');
  if (pdfMagic !== '%PDF-') {
    return NextResponse.json({ error: 'Invalid file content. File is not a valid PDF.' }, { status: 400 });
  }

  const fileName = file.name || 'cession-agreement.pdf';

  try {
    const result = await uploadCessionAgreement({
      supplierId: session.supplierId,
      file: buffer,
      fileName,
    });
    return NextResponse.json({ success: true, documentUrl: result.documentUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Upload failed', details: errorMessage }, { status: 500 });
  }
}
