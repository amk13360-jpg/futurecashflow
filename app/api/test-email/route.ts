import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/email';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/test-email?to=...
 * Admin-only endpoint for testing email delivery.
 * Protected by middleware (removed from publicApiRoutes) and
 * by an explicit session + role check here as defense-in-depth.
 */
export async function GET(request: Request) {
  // Defense-in-depth: verify admin session even though middleware protects this
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const to = url.searchParams.get('to');
  
  if (!to) {
    return NextResponse.json({ error: 'Missing "to" email parameter' }, { status: 400 });
  }
  
  try {
    const result = await sendEmail({
      to,
      subject: 'Test Email from SCF Platform',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the SCF Platform.</p>
        <p>If you received this, email sending is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      text: 'This is a test email from the SCF Platform.'
    });
    
    console.log('[Test Email] Result:', result);
    
    return NextResponse.json({ 
      success: result, 
      message: result ? 'Email sent successfully!' : 'Failed to send email. Check server logs.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test Email] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
