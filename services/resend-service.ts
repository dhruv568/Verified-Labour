import { Resend } from 'resend';
import activeOtps from '@/lib/otp-store';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Verified Labour <noreply@verifiedlabour.com>';
const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export interface RenderOtpEmailOptions {
  otp: string;
  email: string;
  name?: string;
  verifyUrl?: string;
  appUrl?: string;
}

/**
 * Renders a premium HTML email template for Verified Labour OTP verification.
 * Follows table-based HTML email structure, inline CSS, monospace copyable OTP text,
 * responsive design, and Verified Labour brand guidelines.
 */
export function renderOtpEmailHtml(options: RenderOtpEmailOptions): { html: string; text: string } {
  const { otp, email, name, appUrl: customAppUrl, verifyUrl: customVerifyUrl } = options;
  const appUrl = customAppUrl || DEFAULT_APP_URL;
  const verifyUrl = customVerifyUrl || `${appUrl}/auth/verify-email?email=${encodeURIComponent(email)}&otp=${otp}`;
  const logoUrl = process.env.PUBLIC_LOGO_URL || 'https://raw.githubusercontent.com/dhruv568/Verified-Labour/main/public/logo.jpeg';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Verify Your Email - Verified Labour</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F7F9FC; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .content-card { padding: 24px 16px !important; border-radius: 12px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
      .heading-title { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F9FC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F7F9FC; padding: 32px 12px;">
    <tr>
      <td align="center">
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto;">
          
          <!-- HEADER: Logo & Tagline -->
          <tr>
            <td align="center" style="padding-bottom: 24px; text-align: center;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="${logoUrl}" alt="Verified Labour" width="180" style="display: block; width: 180px; max-width: 180px; height: auto; border: 0;" />
              </a>
              <div style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;">
                India's Trusted Skilled Labour Marketplace
              </div>
            </td>
          </tr>

          <!-- MAIN BODY CARD -->
          <tr>
            <td class="content-card" style="background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(15, 42, 95, 0.04);">
              
              <!-- Verification Shield Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <div style="display: inline-block; width: 56px; height: 56px; background-color: #EEFCF3; border-radius: 50%; text-align: center; line-height: 56px;">
                      <span style="font-size: 26px; color: #08783b;">✓</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 class="heading-title" style="font-size: 24px; font-weight: 800; color: #0F2A5F; text-align: center; margin: 0 0 12px 0; letter-spacing: -0.5px;">
                Verify Your Email
              </h1>

              <!-- Greeting & Explanation -->
              <p style="font-size: 15px; line-height: 1.6; color: #475569; text-align: center; margin: 0 0 24px 0;">
                ${name ? `Hello <strong>${name}</strong>,<br/>` : ''}
                Thank you for joining <strong>Verified Labour</strong>. Please use the verification code below to verify your email address and activate your account.
              </p>

              <!-- PROMINENT OTP CARD -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0FDF4; border: 2px dashed #0B9B5A; border-radius: 12px; margin: 0 0 24px 0;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #08783b; margin-bottom: 12px;">
                      Your Verified Labour verification code is
                    </div>

                    <!-- Monospace Copyable Single Text Node -->
                    <div class="otp-code" style="font-family: 'Courier New', Courier, Consolas, monospace, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #0F2A5F; text-align: center; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all; padding: 10px 16px; background-color: #ffffff; border: 1px solid #BBF7D0; border-radius: 8px; display: inline-block;">
                      ${otp}
                    </div>

                    <div style="font-size: 13px; font-weight: 600; color: #047857; margin-top: 14px;">
                      ⏱️ Valid for 10 minutes
                    </div>

                    <div style="font-size: 12px; font-weight: 600; color: #DC2626; margin-top: 6px;">
                      🔒 Never share this code with anyone.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#08783b" style="border-radius: 10px; background-color: #08783b;">
                          <a href="${verifyUrl}" target="_blank" style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 36px; border-radius: 10px; background-color: #08783b; border: 1px solid #08783b; box-shadow: 0 2px 4px rgba(8, 120, 59, 0.2);">
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SECURITY NOTICE -->
              <p style="font-size: 13px; line-height: 1.5; color: #64748B; text-align: center; margin: 0; padding-top: 16px; border-top: 1px solid #F1F5F9;">
                If you did not request this verification code, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 28px 16px; text-align: center; color: #64748B; font-size: 12px; line-height: 1.6;">
              
              <div style="font-size: 14px; font-weight: 700; color: #0F2A5F; margin-bottom: 4px;">
                Verified Labour
              </div>
              <div style="font-size: 12px; color: #64748B; margin-bottom: 16px;">
                Skilled People. Stronger Communities. A Better India.
              </div>

              <div style="margin-bottom: 16px;">
                <a href="${appUrl}/legal/privacy" target="_blank" style="color: #1464D2; text-decoration: none; font-weight: 600; margin: 0 8px;">Privacy Policy</a>
                <span style="color: #CBD5E1;">•</span>
                <a href="${appUrl}/legal/terms" target="_blank" style="color: #1464D2; text-decoration: none; font-weight: 600; margin: 0 8px;">Terms & Conditions</a>
                <span style="color: #CBD5E1;">•</span>
                <a href="mailto:verifiedlabour@gmail.com" style="color: #1464D2; text-decoration: none; font-weight: 600; margin: 0 8px;">Contact Support</a>
              </div>

              <div style="font-size: 11px; color: #94A3B8; margin-bottom: 12px;">
                Support Email: verifiedlabour@gmail.com | Helpline: +91 93698 99597
              </div>

              <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">
                © 2025 Verified Labour. All rights reserved.
              </div>

              <div style="font-size: 12px; font-weight: 600; color: #475569;">
                Powered by <a href="https://myprofunnels.com/" target="_blank" rel="noopener noreferrer" style="color: #08783b; text-decoration: underline; font-weight: 700;">MyProFunnels ❤️</a>
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `VERIFIED LABOUR - EMAIL VERIFICATION

Verify Your Email

${name ? `Hello ${name},\n` : ''}Thank you for choosing Verified Labour. Please use the verification code below to confirm your email address and activate your account.

----------------------------------------
Your Verified Labour verification code is:

[ ${otp} ]

Valid for 10 minutes.
Never share this code with anyone.
----------------------------------------

Or verify directly by opening this link in your browser:
${verifyUrl}

If you did not request this verification code, you can safely ignore this email.

--
Verified Labour
India's Trusted Skilled Labour Marketplace
Privacy Policy: ${appUrl}/legal/privacy
Terms & Conditions: ${appUrl}/legal/terms
Contact Support: verifiedlabour@gmail.com | +91 93698 99597
© 2025 Verified Labour. All rights reserved.
Powered by MyProFunnels ❤️ (https://myprofunnels.com/)`;

  return { html, text };
}

export interface SendEmailOtpResult {
  success: boolean;
  otp: string;
  messageId?: string;
  error?: string;
  html: string;
  text: string;
  expiresInSeconds: number;
}

/**
 * Sends a dynamic OTP via Resend email service, invalidates any existing OTP for the email,
 * stores the new OTP in the active OTP store, and returns full email details.
 */
export async function sendEmailOtp(params: {
  email: string;
  name?: string;
  isResend?: boolean;
}): Promise<SendEmailOtpResult> {
  const normalizedEmail = params.email.toLowerCase().trim();

  // Generate dynamic 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInSeconds = 600; // 10 minutes
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  // Invalidate previous OTP by setting new OTP entry in store
  activeOtps.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
  });

  const { html, text } = renderOtpEmailHtml({
    otp,
    email: normalizedEmail,
    name: params.name,
  });

  let messageId: string | undefined = undefined;

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: normalizedEmail,
        subject: 'Verify Your Email — Verified Labour',
        html,
        text,
      });

      if (response.error) {
        console.error('[Resend Service Error]', response.error);
        return {
          success: false,
          otp,
          error: response.error.message,
          html,
          text,
          expiresInSeconds,
        };
      }
      messageId = response.data?.id;
    } catch (err: any) {
      console.error('[Resend Service Exception]', err);
      return {
        success: false,
        otp,
        error: err.message || 'Failed to dispatch email via Resend',
        html,
        text,
        expiresInSeconds,
      };
    }
  } else {
    console.log(`[Resend Service Mock] OTP Email dispatched to ${normalizedEmail}. Code: ${otp}`);
  }

  return {
    success: true,
    otp,
    messageId,
    html,
    text,
    expiresInSeconds,
  };
}

/**
 * Verifies the OTP code submitted for an email address.
 * Enforces attempt limits, expiry validation, and automatic invalidation upon verification.
 */
export function verifyEmailOtpCode(email: string, otpInput: string): { success: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const stored = activeOtps.get(normalizedEmail);

  if (!stored) {
    return { success: false, error: 'Invalid or expired verification code. Please request a new code.' };
  }

  if (Date.now() > stored.expiresAt) {
    activeOtps.delete(normalizedEmail);
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  if (stored.attempts >= 5) {
    activeOtps.delete(normalizedEmail);
    return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (stored.otp === otpInput) {
    // Invalidate OTP after successful verification
    activeOtps.delete(normalizedEmail);
    return { success: true };
  } else {
    stored.attempts += 1;
    if (stored.attempts >= 5) {
      activeOtps.delete(normalizedEmail);
      return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
    }
    return {
      success: false,
      error: `Incorrect verification code. ${5 - stored.attempts} attempts remaining.`,
    };
  }
}
