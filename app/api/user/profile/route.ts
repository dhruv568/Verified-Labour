import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  bio: z.string().trim().max(500).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid profile data' },
        { status: 400 }
      );
    }

    const { fullName, email, avatarUrl, city, state, bio, experienceYears } = parsed.data;

    if (sessionUser.role === 'CUSTOMER') {
      await prisma.customerProfile.upsert({
        where: { userId: sessionUser.id },
        update: {
          ...(fullName && { fullName }),
          ...(email && { email }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        create: {
          userId: sessionUser.id,
          fullName: fullName || 'Customer',
          email,
          avatarUrl,
        },
      });

      if (email && email !== sessionUser.email) {
        await prisma.user.update({
          where: { id: sessionUser.id },
          data: { email },
        });
      }
    } else if (sessionUser.role === 'WORKER') {
      await prisma.workerProfile.upsert({
        where: { userId: sessionUser.id },
        update: {
          ...(fullName && { fullName }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(city && { city }),
          ...(state && { state }),
          ...(bio !== undefined && { bio }),
          ...(experienceYears !== undefined && { experienceYears }),
        },
        create: {
          userId: sessionUser.id,
          fullName: fullName || 'Worker Partner',
          avatarUrl,
          city: city || 'Surat',
          state: state || 'Gujarat',
          bio,
          experienceYears: experienceYears || 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile: ' + err.message },
      { status: 500 }
    );
  }
}
