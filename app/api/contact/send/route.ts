import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { getSiteContent } from '@/lib/site-config';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Verified Labour Contact <noreply@verifiedlabour.com>';

// In-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name (कम से कम 2 अक्षर)'),
  email: z.string().trim().email('Please enter a valid email address (वैध ईमेल दर्ज करें)'),
  phone: z.string().trim().min(10, 'Please enter a valid 10-digit mobile number (10 अंकों का मोबाइल नंबर)'),
  subject: z.string().trim().optional().default('Support & General Inquiry'),
  message: z.string().trim().min(10, 'Please enter a message with at least 10 characters (कम से कम 10 अक्षर का संदेश)'),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting Check (Max 5 submissions per 10 minutes)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'बहुत अधिक संदेश भेजे गए हैं। कृपया 10 मिनट बाद पुनः प्रयास करें। / Too many messages sent. Please try again in 10 minutes.',
        },
        { status: 429 }
      );
    }

    // 2. Validate Payload
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;

    // Record rate limit timestamp
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    // Get current configured support email from DB/Config
    const siteContent = await getSiteContent();
    const supportEmail = siteContent.contact_email || 'help@verifiedlabour.com';

    // 3. Email Dispatch via Resend (or console log if mock)
    const html = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="border-bottom: 2px solid #08783b; padding-bottom: 12px; margin-bottom: 20px;">
      <h2 style="color: #0f2a5f; margin: 0;">New Contact Inquiry — Verified Labour</h2>
      <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Received via Website Contact Form</p>
    </div>

    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 120px;">Sender Name:</td>
        <td style="padding: 8px 0; color: #0f2a5f; font-weight: bold;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Email Address:</td>
        <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #08783b; font-weight: bold;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Phone Number:</td>
        <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #08783b; font-weight: bold;">${phone}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Subject:</td>
        <td style="padding: 8px 0; color: #1e293b;">${subject}</td>
      </tr>
    </table>

    <div style="margin-top: 20px; background-color: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #08783b;">
      <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Message Content:</div>
      <p style="font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
      Verified Labour Customer Support System • IP: ${ip} • © 2026 Verified Labour
    </div>
  </div>
</body>
</html>`;

    const text = `NEW CONTACT INQUIRY - VERIFIED LABOUR\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nIP: ${ip}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: supportEmail,
          replyTo: email,
          subject: `[Website Inquiry] ${subject} - ${name}`,
          html,
          text,
        });
      } catch (err) {
        console.error('Failed to dispatch contact email via Resend:', err);
      }
    } else {
      console.log(`[Mock Contact Email] Inquiry from ${name} (${email}, ${phone}): ${message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'आपका संदेश सफलतापूर्वक भेज दिया गया है। / Your message has been sent successfully.',
    });
  } catch (err: any) {
    console.error('Contact Form Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'संदेश भेजने में विफल। कृपया पुनः प्रयास करें। / Failed to send message. Please try again: ' + err.message,
      },
      { status: 500 }
    );
  }
}
