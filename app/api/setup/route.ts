import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const current = db.prepare('SELECT is_setup FROM settings WHERE id = 1').get() as any;
    if (current?.is_setup === 1) {
      return NextResponse.json({ error: 'Already setup' }, { status: 403 });
    }

    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const passwordHash = hashPassword(body.password);

    const updateStmt = db.prepare(`
      UPDATE settings 
      SET company_name = ?, business_number = ?, business_phone = ?, 
          business_email = ?, business_website = ?, business_address = ?, 
          tax_rate = ?, payment_terms = ?, require_signature = ?, is_setup = 1, password_hash = ? 
      WHERE id = 1
    `);
    
    updateStmt.run(
      body.company_name, body.business_number, body.business_phone, 
      body.business_email, body.business_website, body.business_address, 
      body.tax_rate, body.payment_terms, body.require_signature ? 1 : 0,
      passwordHash
    );

    // Auto-login upon setup
    const cookieStore = await cookies();
    cookieStore.set('engine_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to complete setup' }, { status: 500 });
  }
}