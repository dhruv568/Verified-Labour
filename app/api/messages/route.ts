import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const messageSchema = z.object({
  jobId: z.string(),
  content: z.string().min(1, 'Message cannot be empty').max(1000),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        worker: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: {
                sender: {
                  select: { id: true, role: true, phone: true },
                },
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const isCustomer = sessionUser.customerProfile?.id === job.customerId;
    const isWorker = sessionUser.workerProfile?.id === job.workerId;
    const isAdmin = sessionUser.role === 'ADMIN';

    if (!isCustomer && !isWorker && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      messages: job.conversation?.messages || [],
      conversationId: job.conversation?.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { jobId, content } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { conversation: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const isCustomer = sessionUser.customerProfile?.id === job.customerId;
    const isWorker = sessionUser.workerProfile?.id === job.workerId;
    const isAdmin = sessionUser.role === 'ADMIN';

    if (!isCustomer && !isWorker && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Ensure conversation exists
    let conversationId = job.conversation?.id;
    if (!conversationId) {
      const conv = await prisma.conversation.create({
        data: {
          jobId: job.id,
          customerId: job.customerId,
          workerId: job.workerId,
        },
      });
      conversationId = conv.id;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: sessionUser.id,
        senderRole: sessionUser.role,
        content,
      },
      include: {
        sender: {
          select: { id: true, role: true, phone: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to send message: ' + err.message },
      { status: 500 }
    );
  }
}
