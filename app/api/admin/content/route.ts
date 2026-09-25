import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSiteContent, updateSiteContent } from '@/lib/site-config';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const content = await getSiteContent();
    return NextResponse.json({
      success: true,
      content,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site content: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid content update payload' },
        { status: 400 }
      );
    }

    const success = await updateSiteContent(body, sessionUser.adminUser?.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update website content in database' },
        { status: 500 }
      );
    }

    const updatedContent = await getSiteContent();

    return NextResponse.json({
      success: true,
      message: 'Website content updated successfully. Live on public website immediately.',
      content: updatedContent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Content update error: ' + err.message },
      { status: 500 }
    );
  }
}
