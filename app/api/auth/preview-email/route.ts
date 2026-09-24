import { NextRequest, NextResponse } from 'next/server';
import { renderOtpEmailHtml } from '@/services/resend-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const otp = searchParams.get('otp') || '187509';
  const email = searchParams.get('email') || 'user@example.com';
  const name = searchParams.get('name') || 'John Doe';
  const format = searchParams.get('format') || 'html';

  const { html, text } = renderOtpEmailHtml({
    otp,
    email,
    name,
  });

  if (format === 'json') {
    return NextResponse.json({ otp, email, name, html, text });
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
