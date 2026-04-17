import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limit map (clears on server restart, perfect for local Docker)
const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF Protection for API mutations
  if (request.method !== 'GET' && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    // Block requests that don't originate from your own domain
    if (origin && !origin.includes(host)) {
      return NextResponse.json({ error: 'CSRF blocked' }, { status: 403 });
    }
  }

  // 2. Rate Limiting for Public Invoice Endpoints
  if (pathname.startsWith('/p/') || pathname.includes('/approve')) {
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxReqs = 60; // Max 60 requests per minute per IP

    const record = rateLimitMap.get(ip) || { count: 0, startTime: now };
    
    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count++;
    }
    
    rateLimitMap.set(ip, record);

    if (record.count > maxReqs) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/p/:path*', '/api/:path*'],
};