import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const settings = db.prepare('SELECT password_hash FROM settings WHERE id = 1').get() as any;

    if (!settings || !settings.password_hash) {
      return NextResponse.json({ error: 'System not configured' }, { status: 400 });
    }

    const isValid = verifyPassword(password, settings.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('engine_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}