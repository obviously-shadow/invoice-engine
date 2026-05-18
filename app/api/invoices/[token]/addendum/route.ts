import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { title, description, qty, price } = body;

    const invoice = db.prepare('SELECT id, status FROM invoices WHERE token = ?').get(resolvedParams.token) as any;
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    if (invoice.status !== 'approved' && invoice.status !== 'partially_paid') {
       return NextResponse.json({ error: 'Addendums can only be added to approved/active projects.' }, { status: 400 });
    }

    const total = (parseFloat(price) || 0) * (parseFloat(qty) || 1);

    db.prepare(`
      INSERT INTO invoice_items (invoice_id, title, description, qty, rate, total, is_tbd, group_name) 
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      invoice.id, 
      title, 
      description || '', 
      parseFloat(qty) || 1, 
      parseFloat(price) || 0, 
      total, 
      'Change Order / Addendum'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to append addendum:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}