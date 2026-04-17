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

    const checkStmt = db.prepare("SELECT status FROM invoices WHERE token = ?");
    const currentInvoice = checkStmt.get(resolvedParams.token) as any;

    if (!currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (currentInvoice.status !== 'draft') {
      return NextResponse.json({ error: 'Invoice is already approved or paid.' }, { status: 409 });
    }

    // Capture precise UTC timestamp from SQLite
    const updateStmt = db.prepare(`
      UPDATE invoices 
      SET status = 'approved', signature_data = ?, signed_at = CURRENT_TIMESTAMP 
      WHERE token = ?
    `);
    updateStmt.run(signature, resolvedParams.token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to approve invoice:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}