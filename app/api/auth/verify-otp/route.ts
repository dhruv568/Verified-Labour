import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signAuthToken, setAuthCookie } from '@/lib/auth';
import activeOtps from '@/lib/otp-store';
import { verifyEmailOtpCode } from '@/services/resend-service';

const verifyOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  role: z.enum(['CUSTOMER', 'WORKER', 'BUSINESS']).default('CUSTOMER'),
  fullName: z.string().optional(),
}).refine(data => data.phone || data.email, {
  message: 'Either phone or email is required for OTP verification',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    let { phone, email, otp, role, fullName } = parsed.data;
    let isValid = false;

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailVerify = verifyEmailOtpCode(normalizedEmail, otp);
      if (!emailVerify.success) {
        return NextResponse.json(
          { success: false, error: emailVerify.error || 'Invalid or expired OTP.' },
          { status: 400 }
        );
      }
      isValid = true;
    } else if (phone) {
      phone = phone.replace(/\s+/g, '');
      if (!phone.startsWith('+91')) {
        phone = `+91${phone.replace(/^0+/, '')}`;
      }

      const stored = activeOtps.get(phone);

      if (stored) {
        if (Date.now() > stored.expiresAt) {
          activeOtps.delete(phone);
          return NextResponse.json(
            { success: false, error: 'OTP has expired. Please request a new code.' },
            { status: 400 }
          );
        }

        if (stored.attempts >= 5) {
          activeOtps.delete(phone);
          return NextResponse.json(
            { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' },
            { status: 429 }
          );
        }

        if (stored.otp === otp) {
          isValid = true;
          activeOtps.delete(phone);
        } else {
          stored.attempts += 1;
          return NextResponse.json(
            {
              success: false,
              error: `Incorrect OTP. ${5 - stored.attempts} attempts remaining.`,
            },
            { status: 400 }
          );
        }
      } else if (process.env.NODE_ENV !== 'production' && otp === '123456') {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP.' },
        { status: 400 }
      );
    }

    // Find or create user
    const formattedPhone = phone ? (phone.startsWith('+91') ? phone : `+91${phone.replace(/^0+/, '')}`) : undefined;
    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(formattedPhone ? [{ phone: formattedPhone }] : []),
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
      include: {
        customerProfile: { include: { addresses: true } },
        workerProfile: { include: { primaryCategory: true, aadhaarVerif: true, bankVerif: true } },
        businessProfile: true,
        adminUser: true,
      },
    });

    const isNewUser = !existingUser;
    let user = existingUser;

    if (!user) {
      const userPhone = formattedPhone || `+9100000${Math.floor(10000 + Math.random() * 90000)}`;
      user = await prisma.user.create({
        data: {
          phone: userPhone,
          email: normalizedEmail,
          role,
          status: 'ACTIVE',
          isPhoneVerified: !!formattedPhone,
          isEmailVerified: !!normalizedEmail,
          ...(role === 'CUSTOMER' && {
            customerProfile: {
              create: {
                fullName: fullName || 'New Customer',
                email: normalizedEmail,
              },
            },
          }),
          ...(role === 'WORKER' && {
            workerProfile: {
              create: {
                fullName: fullName || 'New Worker',
                status: 'ONBOARDING',
                isAvailable: true,
                serviceRadiusKm: 15.0,
              },
            },
          }),
          ...(role === 'BUSINESS' && {
            businessProfile: {
              create: {
                companyName: fullName || 'Business Client',
                contactPerson: fullName || 'Authorized Representative',
                contactPhone: userPhone,
                contactEmail: normalizedEmail,
              },
            },
          }),
        },
        include: {
          customerProfile: { include: { addresses: true } },
          workerProfile: { include: { primaryCategory: true, aadhaarVerif: true, bankVerif: true } },
          businessProfile: true,
          adminUser: true,
        },
      });
    } else {
      const updateData: any = {
        status: 'ACTIVE',
      };
      if (normalizedEmail) {
        updateData.isEmailVerified = true;
        if (!user.email) updateData.email = normalizedEmail;
      }
      if (phone) {
        updateData.isPhoneVerified = true;
      }
      if (role === 'WORKER' && !user.workerProfile) {
        await prisma.workerProfile.create({
          data: {
            userId: user.id,
            fullName: fullName || user.customerProfile?.fullName || 'New Worker',
            status: 'ONBOARDING',
            isAvailable: true,
            serviceRadiusKm: 15.0,
          },
        });
        updateData.role = 'WORKER';
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          customerProfile: { include: { addresses: true } },
          workerProfile: { include: { primaryCategory: true, aadhaarVerif: true, bankVerif: true } },
          businessProfile: true,
          adminUser: true,
        },
      });
    }

    // Sign JWT Token
    const token = await signAuthToken({
      userId: user.id,
      phone: user.phone,
      email: user.email || undefined,
      role: user.role as any,
    });

    const response = NextResponse.json({
      success: true,
      isNewUser,
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
      message: 'Authentication successful',
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to complete OTP verification: ' + err.message },
      { status: 500 }
    );
  }
}
