import { NextResponse } from 'next/server';
import pkg from '@/package.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  let localSha = "development";
  
  if (process.env.IMAGE_SHA) {
    localSha = process.env.IMAGE_SHA;
  }

  return NextResponse.json({
    status: 'healthy',
    version: pkg.version,
    localSha: localSha,
    repo: "obviously-shadow/invoice-engine" 
  });
}