import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Authenticate Admin access (accepts messages.view or dashboard.view for Super Admin / Admin)
    let auth = await requirePermission(req, 'messages.view');
    if (auth.error) {
      auth = await requirePermission(req, 'dashboard.view');
      if (auth.error) return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get('filter') || 'ALL').toUpperCase();
    const search = searchParams.get('search')?.trim() || '';

    // Calculate Summary Counts across all messages
    const [total, unreadCount, readCount, respondedCount] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.contactMessage.count({ where: { isRead: true, respondedAt: null } }),
      prisma.contactMessage.count({ where: { respondedAt: { not: null } } }),
    ]);

    // Build Prisma query condition based on filter
    const where: any = {};

    if (filter === 'UNREAD') {
      where.isRead = false;
    } else if (filter === 'READ') {
      where.isRead = true;
      where.respondedAt = null;
    } else if (filter === 'RESPONDED') {
      where.respondedAt = { not: null };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      counts: {
        total,
        unread: unreadCount,
        read: readCount,
        responded: respondedCount,
      },
      messages,
    });
  } catch (err: any) {
    console.error('Error fetching admin messages:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback messages: ' + err.message },
      { status: 500 }
    );
  }
}
