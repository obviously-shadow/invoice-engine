import { NextResponse } from 'next/server';
import pkg from '@/package.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  let updateAvailable = false;
  let latestVersion = pkg.version;

  try {
    // Check the raw package.json from the official repository
    const response = await fetch('https://raw.githubusercontent.com/obviously-shadow/invoice-engine/main/package.json', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (response.ok) {
      const remotePkg = await response.json();
      if (remotePkg.version && remotePkg.version !== pkg.version) {
        updateAvailable = true;
        latestVersion = remotePkg.version;
      }
    }
  } catch (e) {
    console.error("Version check failed:", e);
  }

  return NextResponse.json({
    status: 'healthy',
    currentVersion: pkg.version,
    latestVersion,
    updateAvailable
  });
}