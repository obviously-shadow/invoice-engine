import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_name, client_email, client_address, items, tax_rate, notes, is_tbd } = body;

    const token = crypto.randomBytes(16).toString('hex');

    const insertInvoice = db.prepare('INSERT INTO invoices (client_name, client_email, client_address, token, status, tax_rate, notes, is_tbd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO invoice_items (invoice_id, title, description, qty, rate, total, is_tbd, group_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      const info = insertInvoice.run(client_name || 'Valued Client', client_email, client_address, token, 'draft', tax_rate, notes || '', is_tbd ? 1 : 0);
      const invoiceId = info.lastInsertRowid;

      for (const item of items) {
        const qty = item.qty || 1;
        const groupName = item.group_name || '';
        
        if (item.isCustom) {
          const rate = item.price || 0;
          const total = item.is_tbd ? 0 : (rate * qty);
          insertItem.run(invoiceId, item.title, item.description || '', qty, rate, total, item.is_tbd ? 1 : 0, groupName);
        } else {
          const itemIsTbd = item.is_tbd ? 1 : 0;
          const baseRate = item.default_material_cost + (item.default_labor_hours * item.hourly_rate);
          const total = itemIsTbd ? 0 : (baseRate * qty);
          insertItem.run(invoiceId, item.title, item.description || 'Standard Service Profile', qty, baseRate, total, itemIsTbd, groupName);
        }
      }
    });

    transaction();
    return NextResponse.json({ success: true, token });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}