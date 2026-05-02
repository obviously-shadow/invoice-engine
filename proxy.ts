import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limit map
const rateLimitMap = new Map();

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. SECURITY FIREWALL (Authentication)
  const isProtectedUI = pathname.startsWith('/admin');
  const isProtectedAPI = pathname.startsWith('/api/settings') || pathname.startsWith('/api/templates');

  if (isProtectedUI || isProtectedAPI) {
    const session = request.cookies.get('engine_session')?.value;
    
    if (!session || session !== 'authenticated') {
      if (isProtectedAPI) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. CSRF Protection for API mutations
  if (request.method !== 'GET' && pathname.startsWith('/api/')) {
    if (!pathname.includes('/approve')) {
      const origin = request.headers.get('origin') || '';
      const host = request.headers.get('host') || '';
      const expectedOrigin = process.env.APP_ORIGIN || '';

      if (origin) {
        const isValidOrigin = expectedOrigin ? origin === expectedOrigin : origin.includes(host);
        if (!isValidOrigin) {
          return NextResponse.json({ error: 'Security block' }, { status: 403 });
        }
      }
    }
  }

  // 3. Rate Limiting for Public Invoice Endpoints
  if (pathname.startsWith('/p/') || pathname.includes('/approve')) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    
    const record = rateLimitMap.get(ip) || { count: 0, startTime: now };
    if (now - record.startTime > 60000) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count++;
    }
    rateLimitMap.set(ip, record);

    if (record.count > 60) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/p/:path*', 
    '/api/:path*',
    '/admin/:path*'
  ],
};