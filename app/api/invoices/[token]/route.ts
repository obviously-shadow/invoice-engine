import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { client_name, client_email, client_address, items, tax_rate, notes, is_tbd } = body;

    // FIXED: Swapped double quotes for single quotes around 'draft'
    const updateInvoice = db.prepare("UPDATE invoices SET client_name=?, client_email=?, client_address=?, tax_rate=?, notes=?, is_tbd=? WHERE token=? AND status='draft'");
    const deleteItems = db.prepare("DELETE FROM invoice_items WHERE invoice_id = (SELECT id FROM invoices WHERE token=?)");
    const insertItem = db.prepare("INSERT INTO invoice_items (invoice_id, title, description, qty, rate, total, is_tbd, group_name) VALUES ((SELECT id FROM invoices WHERE token=?), ?, ?, ?, ?, ?, ?, ?)");

    const transaction = db.transaction(() => {
      const result = updateInvoice.run(client_name, client_email, client_address, tax_rate, notes || '', is_tbd ? 1 : 0, resolvedParams.token);
      
      if (result.changes === 0) {
        throw new Error("Invoice cannot be edited or does not exist.");
      }

      deleteItems.run(resolvedParams.token);

      for (const item of items) {
        const qty = item.qty || 1;
        const groupName = item.group_name || '';
        const rate = item.price || 0;
        const total = item.is_tbd ? 0 : (rate * qty);
        insertItem.run(resolvedParams.token, item.title, item.description || '', qty, rate, total, item.is_tbd ? 1 : 0, groupName);
      }
    });

    transaction();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    // FIXED: Swapped double quotes for single quotes around 'draft'
    const deleteStmt = db.prepare("UPDATE invoices SET is_archived = 1 WHERE token = ? AND status = 'draft'");
    const result = deleteStmt.run(resolvedParams.token);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Invoice not found or cannot be deleted.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}