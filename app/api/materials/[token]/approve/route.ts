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
    
    if (signature) {
      if (!signature.startsWith('data:image/png;base64,')) {
        return NextResponse.json({ error: 'Invalid signature format.' }, { status: 400 });
      }
      if (signature.length > 2800000) {
        return NextResponse.json({ error: 'Signature payload too large.' }, { status: 413 });
      }
    }

    const checkStmt = db.prepare("SELECT status FROM material_receipts WHERE token = ?");
    const currentReceipt = checkStmt.get(resolvedParams.token) as any;

    if (!currentReceipt) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (currentReceipt.status !== 'draft') {
      return NextResponse.json({ error: 'Report is already approved.' }, { status: 409 });
    }

    const updateStmt = db.prepare(`
      UPDATE material_receipts 
      SET status = 'approved', signature_data = ?, signed_at = CURRENT_TIMESTAMP 
      WHERE token = ?
    `);
    updateStmt.run(signature, resolvedParams.token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to approve material receipt:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}