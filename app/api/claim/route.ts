import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const current = db.prepare('SELECT is_setup, password_hash FROM settings WHERE id = 1').get() as any;

    if (!current || current.is_setup === 0) {
      return NextResponse.json({ error: 'System not setup yet' }, { status: 400 });
    }
    if (current.password_hash) {
      return NextResponse.json({ error: 'Account already claimed' }, { status: 403 });
    }

    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const passwordHash = hashPassword(body.password);
    db.prepare('UPDATE settings SET password_hash = ? WHERE id = 1').run(passwordHash);

    // Auto-login upon claim
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
    return NextResponse.json({ error: 'Failed to claim account' }, { status: 500 });
  }
}