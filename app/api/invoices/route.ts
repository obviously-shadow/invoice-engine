import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, tax_rate } = body;

    // 1. Generate the massive, un-guessable token for the URL
    const token = crypto.randomBytes(16).toString('hex');

    // 2. Prepare the database insert statements
    const insertInvoice = db.prepare('INSERT INTO invoices (token, status, tax_rate) VALUES (?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)');

    // 3. Use a transaction so if one piece fails, the whole thing cancels safely
    const transaction = db.transaction(() => {
      const info = insertInvoice.run(token, 'draft', tax_rate);
      const invoiceId = info.lastInsertRowid;

      for (const item of items) {
        const description = `${item.title} (${item.default_labor_hours}h labor, parts)`;
        const unitPrice = (item.default_labor_hours * item.hourly_rate) + item.default_material_cost;
        insertItem.run(invoiceId, description, 1, unitPrice);
      }
    });

    // Execute the database save
    transaction();

    // 4. Send the token back to the frontend
    return NextResponse.json({ success: true, token });

  } catch (error) {
    console.error("Failed to generate invoice:", error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}