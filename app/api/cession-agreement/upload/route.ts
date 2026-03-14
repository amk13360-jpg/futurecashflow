import { NextRequest, NextResponse } from 'next/server';
import { uploadCessionAgreement } from '@/lib/actions/suppliers';
import { getSupplierSession } from '@/lib/auth/session';
import { 
  sanitizeFileName, 
  validatePDFContent, 
  secureLog,
  getClientIP,
  hashIPAddress,
  hashUserAgent
} from '@/lib/security/enhanced';

export async function POST(req: NextRequest) {
  const session = await getSupplierSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Enhanced security logging
  const requestInfo = {
    supplierId: session.supplierId,
    ip: hashIPAddress(getClientIP(req)),
    userAgent: hashUserAgent(req.headers.get('user-agent') || 'unknown')
  };

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Enhanced file validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      secureLog('warn', 'File upload rejected - too large', {
        ...requestInfo,
        fileSize: file.size,
        fileName: file.name
      });
      return NextResponse.json({ 
        error: 'File too large. Maximum 10MB allowed.' 
      }, { status: 400 });
    }

    // Minimum file size check (prevent empty/corrupted files)
    if (file.size < 100) {
      return NextResponse.json({ 
        error: 'File too small. Minimum 100 bytes required.' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      secureLog('warn', 'File upload rejected - invalid type', {
        ...requestInfo,
        fileType: file.type,
        fileName: file.name
      });
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF files are accepted.' 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Enhanced PDF validation
    const pdfValidation = validatePDFContent(buffer);
    if (!pdfValidation.valid) {
      secureLog('warn', 'File upload rejected - invalid PDF', {
        ...requestInfo,
        fileName: file.name,
        validationError: pdfValidation.error
      });
      return NextResponse.json({ 
        error: 'Invalid PDF file: ' + pdfValidation.error 
      }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = sanitizeFileName(file.name || 'cession-agreement.pdf');

    secureLog('info', 'File upload initiated', {
      ...requestInfo,
      originalFileName: file.name,
      sanitizedFileName,
      fileSize: file.size
    });

    const result = await uploadCessionAgreement({
      supplierId: session.supplierId,
      file: buffer,
      fileName: sanitizedFileName,
    });

    secureLog('info', 'File upload completed successfully', {
      ...requestInfo,
      fileName: sanitizedFileName,
      documentUrl: result.documentUrl ? '[PRESENT]' : '[MISSING]'
    });

    return NextResponse.json({ 
      success: true, 
      documentUrl: result.documentUrl 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    secureLog('error', 'File upload failed', {
      ...requestInfo,
      error: errorMessage
    });
    
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: 'Internal server error' // Don't expose internal error details
    }, { status: 500 });
  }
}
