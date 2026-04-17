import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_name, client_email, client_address, items, tax_rate, notes } = body;

    const token = crypto.randomBytes(16).toString('hex');

    const insertInvoice = db.prepare('INSERT INTO invoices (client_name, client_email, client_address, token, status, tax_rate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO invoice_items (invoice_id, title, description, qty, rate, total) VALUES (?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      const info = insertInvoice.run(client_name || 'Valued Client', client_email, client_address, token, 'draft', tax_rate, notes || '');
      const invoiceId = info.lastInsertRowid;

      for (const item of items) {
        if (item.isCustom) {
          insertItem.run(invoiceId, item.title, item.description || '', 1, item.price, item.price);
        } else {
          if (item.default_labor_hours > 0) {
            const laborTotal = item.default_labor_hours * item.hourly_rate;
            insertItem.run(invoiceId, item.title, 'Labor', item.default_labor_hours, item.hourly_rate, laborTotal);
          }
          if (item.default_material_cost > 0) {
            insertItem.run(invoiceId, `${item.title} (Materials)`, 'Parts & Supplies', 1, item.default_material_cost, item.default_material_cost);
          }
        }
      }
    });

    transaction();
    return NextResponse.json({ success: true, token });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}