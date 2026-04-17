import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Update the status to 'paid'
    const updateStmt = db.prepare("UPDATE invoices SET status = 'paid' WHERE token = ?");
    const info = updateStmt.run(resolvedParams.token);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark paid:", error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}