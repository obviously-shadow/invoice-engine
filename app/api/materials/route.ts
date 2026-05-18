import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='material_receipts'").get();
    if (!tableCheck) {
       return NextResponse.json({ receipts: [] });
    }
    const receipts = db.prepare('SELECT * FROM material_receipts WHERE is_archived = 0 ORDER BY created_at DESC').all();
    return NextResponse.json({ receipts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_name, client_email, client_address, items, tax_rate, notes, sourcing_fee, deposit_amount } = body;

    const token = crypto.randomBytes(16).toString('hex');

    const maxStmt = db.prepare('SELECT MAX(display_number) as max_num FROM material_receipts');
    const maxResult = maxStmt.get() as { max_num: number | null };
    
    let nextDisplayNum = 8000;
    if (maxResult && maxResult.max_num && maxResult.max_num >= 8000) {
        nextDisplayNum = maxResult.max_num + 1;
    }

    const baseCost = items.reduce((sum: number, item: any) => sum + ((parseFloat(item.cost) || 0) * (parseFloat(item.qty) || 1)), 0);

    const insertReceipt = db.prepare('INSERT INTO material_receipts (client_name, client_email, client_address, token, status, tax_rate, notes, sourcing_fee, deposit_amount, display_number, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO material_items (receipt_id, title, description, qty, cost, total) VALUES (?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      const info = insertReceipt.run(client_name || 'Client', client_email, client_address, token, 'draft', tax_rate, notes || '', parseFloat(sourcing_fee) || 0, parseFloat(deposit_amount) || 0, nextDisplayNum, baseCost);
      const receiptId = info.lastInsertRowid;

      for (const item of items) {
        const qty = parseFloat(item.qty) || 1;
        const cost = parseFloat(item.cost) || 0;
        const total = cost * qty;
        insertItem.run(receiptId, item.title, item.description || '', qty, cost, total);
      }
    });

    transaction();
    return NextResponse.json({ success: true, token });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}