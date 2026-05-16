import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { amount, method, notes, isFinal } = body;

    const invoice = db.prepare('SELECT id, status FROM invoices WHERE token = ?').get(resolvedParams.token) as any;
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    if (amount > 0) {
      db.prepare('INSERT INTO invoice_payments (invoice_id, amount, method, notes) VALUES (?, ?, ?, ?)').run(
        invoice.id, amount, method || 'Transfer', notes || ''
      );
    }

    if (isFinal) {
       db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?").run(invoice.id);
    } else {
       // Forces status to partially_paid even if it was previously just a draft
       db.prepare("UPDATE invoices SET status = 'partially_paid' WHERE id = ?").run(invoice.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process payment:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}