import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { sendContactResponseEmail } from '@/services/resend-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let auth = await requirePermission(req, 'messages.respond');
    if (auth.error) {
      auth = await requirePermission(req, 'dashboard.view');
      if (auth.error) return auth.error;
    }

    const { id } = params;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Message not found.' },
        { status: 404 }
      );
    }

    // Dispatch reply email via existing Resend email service
    const emailResult = await sendContactResponseEmail({
      name: existingMessage.name,
      email: existingMessage.email,
    });

    // If email dispatch fails, DO NOT mark as Responded
    if (!emailResult.success) {
      console.error(
        `[Admin Feedback Email Failure] Failed to send email to message ID ${id} (${existingMessage.email}). Error: ${emailResult.error}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Failed to send email to ${existingMessage.email}: ${emailResult.error || 'Unknown email service error'}. Please retry.`,
        },
        { status: 500 }
      );
    }

    // On email success, update DB status: isRead = true, respondedAt = new Date()
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: {
        isRead: true,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Response email sent successfully to ${existingMessage.email}.`,
      contactMessage: updatedMessage,
    });
  } catch (err: any) {
    console.error(`[Admin Feedback Respond Exception] Error responding to message ID ${params.id}:`, err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to process response: ' + err.message },
      { status: 500 }
    );
  }
}
