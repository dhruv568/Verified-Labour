import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let auth = await requirePermission(req, 'messages.respond');
    if (auth.error) {
      auth = await requirePermission(req, 'messages.view');
      if (auth.error) {
        auth = await requirePermission(req, 'dashboard.view');
        if (auth.error) return auth.error;
      }
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

    // Update message status to isRead = true
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Message marked as read.',
      contactMessage: updatedMessage,
    });
  } catch (err: any) {
    console.error('Error marking message as read:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update message status: ' + err.message },
      { status: 500 }
    );
  }
}
