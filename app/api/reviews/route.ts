import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import JobStateMachine from '@/services/job-state-machine';

const reviewSchema = z.object({
  jobId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  categoryFeedback: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { jobId, rating, comment, categoryFeedback } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { customer: true, review: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Only customer of this job can review
    if (sessionUser.customerProfile?.id !== job.customerId) {
      return NextResponse.json(
        { success: false, error: 'Only the customer who booked this job can submit a review' },
        { status: 403 }
      );
    }

    // Job must be paid or completed
    if (!['PAID', 'COMPLETED', 'REVIEWED'].includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'Review can only be submitted after payment / completion of the job' },
        { status: 400 }
      );
    }

    // Single review constraint check
    if (job.review) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a review for this job' },
        { status: 409 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        jobId,
        customerId: job.customerId,
        workerId: job.workerId,
        rating,
        comment: comment || '',
        categoryFeedback: categoryFeedback ? JSON.stringify(categoryFeedback) : null,
        isModerated: true,
      },
    });

    // If job was PAID, transition to REVIEWED or COMPLETED
    if (job.status === 'PAID') {
      try {
        await JobStateMachine.transition({
          jobId,
          toStatus: 'REVIEWED',
          changedByUserId: sessionUser.id,
          userRole: 'CUSTOMER',
          note: `Customer submitted a ${rating}-star review`,
        });
      } catch (err) {
        // Safe to ignore if status already changed
      }
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Thank you! Your review has been recorded.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit review: ' + err.message },
      { status: 500 }
    );
  }
}
