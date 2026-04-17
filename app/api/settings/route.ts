import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const updateStmt = db.prepare(`
      UPDATE settings 
      SET company_name = ?, business_number = ?, business_phone = ?, 
          business_email = ?, business_website = ?, business_address = ?, 
          tax_rate = ?, payment_terms = ?, require_signature = ? 
      WHERE id = 1
    `);
    
    updateStmt.run(
      body.company_name, body.business_number, body.business_phone, 
      body.business_email, body.business_website, body.business_address, 
      body.tax_rate, body.payment_terms, body.require_signature ? 1 : 0
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}