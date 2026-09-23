import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'WORKER' || !sessionUser.workerProfile) {
      return NextResponse.json(
        { success: false, error: 'Only verified workers can apply for bulk requirements' },
        { status: 403 }
      );
    }

    const workerId = sessionUser.workerProfile.id;
    const { id: requirementId } = params;

    const requirement = await prisma.bulkRequirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement || requirement.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: 'This requirement is no longer accepting applications' },
        { status: 400 }
      );
    }

    const application = await prisma.bulkRequirementApplication.upsert({
      where: {
        requirementId_workerId: {
          requirementId,
          workerId,
        },
      },
      update: {
        status: 'APPLIED',
      },
      create: {
        requirementId,
        workerId,
        status: 'APPLIED',
      },
    });

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully to the business contractor',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit application: ' + err.message },
      { status: 500 }
    );
  }
}
