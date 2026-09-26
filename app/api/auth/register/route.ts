import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashPassword, normalizePhone } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendEmailOtp } from '@/services/resend-service';

// Robust Indian mobile phone validation
// Matches 10 digits starting with 6, 7, 8, or 9 with optional +91, 91, or 0 prefix
const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;

// Email validation regex (RFC 5322 compatible basic check)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must not exceed 80 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .regex(emailRegex, 'Please enter a valid email address (e.g. name@example.com)'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(phoneRegex, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['CUSTOMER', 'WORKER', 'BUSINESS']).default('CUSTOMER'),
  skill: z.string().optional(),
  customSkill: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limiting: 10 registrations per hour per IP
    const rateLimit = checkRateLimit(`reg_${ip}`, 10, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid registration details';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { name, email, phone: rawPhone, password, role, skill, customSkill } = parsed.data;
    const normalizedPhone = normalizePhone(rawPhone);
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify email uniqueness
    const existingEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email address already exists. Please log in with your email and password.',
        },
        { status: 409 }
      );
    }

    // 2. Verify phone uniqueness
    const existingPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this mobile number already exists. Please use a different mobile number or sign in.',
        },
        { status: 409 }
      );
    }

    // 3. Resolve category ID for worker skill if provided
    let primaryCategoryId: string | undefined = undefined;
    if (role === 'WORKER' && skill) {
      // Look up category in existing Category table
      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: skill },
            { id: skill },
          ],
        },
      });
      if (category) {
        primaryCategoryId = category.id;
      } else {
        // Fallback search by slug or name
        const fallbackCat = await prisma.category.findFirst({
          where: { isActive: true },
        });
        if (fallbackCat) {
          primaryCategoryId = fallbackCat.id;
        }
      }
    }

    // 4. Hash password securely using bcrypt
    const passwordHash = await hashPassword(password);

    // 5. Create User as PENDING_VERIFICATION
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        passwordHash,
        role,
        status: 'PENDING_VERIFICATION',
        isPhoneVerified: false,
        isEmailVerified: false,
        ...(role === 'CUSTOMER' && {
          customerProfile: {
            create: {
              fullName: name,
              email: normalizedEmail,
            },
          },
        }),
        ...(role === 'WORKER' && {
          workerProfile: {
            create: {
              fullName: name,
              status: 'ONBOARDING',
              isAvailable: true,
              serviceRadiusKm: 15.0,
              primaryCategoryId,
              bio: customSkill ? `Specialized Skill: ${customSkill}` : undefined,
              ...(primaryCategoryId && {
                skills: {
                  create: [
                    {
                      categoryId: primaryCategoryId,
                      yearsExperience: 1,
                      isVerified: false,
                    },
                  ],
                },
              }),
            },
          },
        }),
        ...(role === 'BUSINESS' && {
          businessProfile: {
            create: {
              companyName: name,
              contactPerson: name,
              contactPhone: normalizedPhone,
              contactEmail: normalizedEmail,
            },
          },
        }),
      },
      include: {
        customerProfile: { include: { addresses: true } },
        workerProfile: {
          include: {
            primaryCategory: true,
            aadhaarVerif: true,
            bankVerif: true,
            skills: { include: { category: true } },
          },
        },
        businessProfile: true,
        adminUser: true,
      },
    });

    // 5. Generate and send Email OTP via Resend integration
    const otpResult = await sendEmailOtp({ email: normalizedEmail, name });
    if (!otpResult.success) {
      console.error('Failed to send registration OTP email:', otpResult.error);
      return NextResponse.json(
        { success: false, error: otpResult.error || 'Account created, but failed to send verification code. Please try logging in to request a new code.' },
        { status: 500 }
      );
    }

    // DO NOT create authenticated session JWT
    // DO NOT set auth cookie

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Verification code sent to your email.',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        customerProfile: user.customerProfile,
        workerProfile: user.workerProfile,
        businessProfile: user.businessProfile,
        adminUser: user.adminUser,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
