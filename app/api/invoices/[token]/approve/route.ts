import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { signature } = body;
    
    // Security: Only update if it is currently a draft (Idempotency)
    const updateStmt = db.prepare("UPDATE invoices SET status = 'approved', signature_data = ? WHERE token = ? AND status = 'draft'");
    const info = updateStmt.run(signature, resolvedParams.token);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Invoice not found or already approved' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}