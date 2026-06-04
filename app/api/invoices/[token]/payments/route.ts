import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { amount, method, notes } = body;

    const paymentAmount = parseFloat(amount) || 0;

    const invoice = db.prepare('SELECT id FROM invoices WHERE token = ?').get(resolvedParams.token) as any;
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // 1. Insert the new payment record
    if (paymentAmount > 0) {
      db.prepare('INSERT INTO invoice_payments (invoice_id, amount, method, notes) VALUES (?, ?, ?, ?)').run(
        invoice.id, paymentAmount, method || 'Transfer', notes || ''
      );
    }

    // 2. Safely recalculate all totals directly from the database schema
    const totals = db.prepare(`
      SELECT 
        i.tax_rate,
        COALESCE((SELECT SUM(total) FROM invoice_items WHERE invoice_id = i.id AND is_tbd = 0), 0) as subtotal,
        COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id), 0) as total_paid
      FROM invoices i 
      WHERE i.id = ?
    `).get(invoice.id) as any;

    const subtotal = totals.subtotal;
    const tax = subtotal * (totals.tax_rate / 100);
    const grandTotal = subtotal + tax;
    const totalPaid = totals.total_paid;

    // 3. Round to 2 decimals to bypass JavaScript floating-point drift
    const roundedGrandTotal = Math.round(grandTotal * 100) / 100;
    const roundedTotalPaid = Math.round(totalPaid * 100) / 100;

    // 4. Autonomously assign the status
    let newStatus = 'partially_paid';
    if (roundedTotalPaid >= roundedGrandTotal) {
       newStatus = 'paid';
    }

    db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(newStatus, invoice.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process payment:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}