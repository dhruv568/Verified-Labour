import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { syncWorkerVerificationStatus } from '@/lib/worker-verification';

const onboardingUpdateSchema = z.object({
  step: z.number().int().min(1).max(8),
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  primaryCategoryId: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  hourlyRate: z.number().min(50).optional(),
  skills: z.array(z.string()).optional(), // array of category/service IDs
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadiusKm: z.number().min(1).max(100).optional(),
  serviceAreas: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: sessionUser.id },
      include: {
        primaryCategory: true,
        aadhaarVerif: true,
        bankVerif: true,
        serviceAreas: true,
        skills: true,
        documents: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = onboardingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Update based on onboarding step
    const updateData: any = {};

    if (data.fullName) updateData.fullName = data.fullName;
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender) updateData.gender = data.gender;
    if (data.bio) updateData.bio = data.bio;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    if (data.primaryCategoryId) updateData.primaryCategoryId = data.primaryCategoryId;
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.city) updateData.city = data.city;
    if (data.state) updateData.state = data.state;
    if (data.postalCode) updateData.postalCode = data.postalCode;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = data.serviceRadiusKm;

    await prisma.workerProfile.update({
      where: { id: worker.id },
      data: updateData,
    });

    // Update service areas if provided
    if (data.serviceAreas && data.serviceAreas.length > 0) {
      await prisma.workerServiceArea.deleteMany({ where: { workerId: worker.id } });
      await prisma.workerServiceArea.createMany({
        data: data.serviceAreas.map((areaName) => ({
          workerId: worker.id,
          city: data.city || worker.city || 'Surat',
          areaName,
          postalCode: data.postalCode || worker.postalCode,
        })),
      });
    }

    // Refresh worker with latest verification status
    const updated = await prisma.workerProfile.findUnique({
      where: { id: worker.id },
      include: {
        primaryCategory: true,
        aadhaarVerif: true,
        bankVerif: true,
        serviceAreas: true,
        documents: true,
      },
    });

    // Sync and evaluate verification status centrally
    const calculatedStatus = await syncWorkerVerificationStatus(worker.id);

    return NextResponse.json({
      success: true,
      step: data.step,
      worker: updated,
      status: calculatedStatus,
      message: 'Onboarding step saved successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update onboarding step: ' + err.message },
      { status: 500 }
    );
  }
}
