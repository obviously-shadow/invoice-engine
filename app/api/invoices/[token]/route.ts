import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { client_name, client_email, client_address, items, tax_rate, notes, is_tbd, due_date } = body;

    const updateInvoice = db.prepare(`
      UPDATE invoices 
      SET client_name=?, client_email=?, client_address=?, tax_rate=?, notes=?, is_tbd=?, is_archived=0, due_date=? 
      WHERE token=?
    `);
    
    const deleteItems = db.prepare("DELETE FROM invoice_items WHERE invoice_id = (SELECT id FROM invoices WHERE token=?)");
    const insertItem = db.prepare("INSERT INTO invoice_items (invoice_id, title, description, qty, rate, total, is_tbd, group_name) VALUES ((SELECT id FROM invoices WHERE token=?), ?, ?, ?, ?, ?, ?, ?)");

    const transaction = db.transaction(() => {
      // Update the invoice details without touching the status or signature data
      const result = updateInvoice.run(client_name, client_email, client_address, tax_rate, notes || '', is_tbd ? 1 : 0, due_date || '', resolvedParams.token);
      
      if (result.changes === 0) {
        throw new Error("Invoice does not exist.");
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
    const invoice = db.prepare("SELECT is_archived FROM invoices WHERE token = ?").get(resolvedParams.token) as any;
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    if (invoice.is_archived === 1) {
      db.prepare("DELETE FROM invoices WHERE token = ?").run(resolvedParams.token);
    } else {
      db.prepare("UPDATE invoices SET is_archived = 1 WHERE token = ?").run(resolvedParams.token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}