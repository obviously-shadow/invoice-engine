import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { client_name, client_email, client_address, items, tax_rate, notes, sourcing_fee, deposit_amount } = body;

    const baseCost = items.reduce((sum: number, item: any) => sum + ((parseFloat(item.cost) || 0) * (parseFloat(item.qty) || 1)), 0);

    const updateReceipt = db.prepare(`
      UPDATE material_receipts 
      SET client_name=?, client_email=?, client_address=?, tax_rate=?, notes=?, sourcing_fee=?, deposit_amount=?, is_archived=0, total_cost=? 
      WHERE token=?
    `);
    
    const deleteItems = db.prepare("DELETE FROM material_items WHERE receipt_id = (SELECT id FROM material_receipts WHERE token=?)");
    const insertItem = db.prepare("INSERT INTO material_items (receipt_id, title, description, qty, cost, total) VALUES ((SELECT id FROM material_receipts WHERE token=?), ?, ?, ?, ?, ?)");

    const transaction = db.transaction(() => {
      const result = updateReceipt.run(client_name, client_email, client_address, tax_rate, notes || '', parseFloat(sourcing_fee) || 0, parseFloat(deposit_amount) || 0, baseCost, resolvedParams.token);
      
      if (result.changes === 0) throw new Error("Receipt does not exist.");

      deleteItems.run(resolvedParams.token);

      for (const item of items) {
        const qty = parseFloat(item.qty) || 1;
        const cost = parseFloat(item.cost) || 0;
        const total = cost * qty;
        insertItem.run(resolvedParams.token, item.title, item.description || '', qty, cost, total);
      }
    });

    transaction();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    db.prepare("UPDATE material_receipts SET is_archived = 1 WHERE token = ?").run(resolvedParams.token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}