import { NextResponse } from 'next/server';
import pkg from '@/package.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const localSha = process.env.IMAGE_SHA || "development";
  const repo = "umarkhorami/invoice-engine"; // Use your Docker handle
  let updateAvailable = false;

  // Only check Docker Hub if we are actually running in production
  if (localSha !== "development") {
    try {
      const response = await fetch(`https://hub.docker.com/v2/repositories/${repo}/tags/latest`, {
        next: { revalidate: 300 } // Cache results for 5 minutes
      });
      const remote = await response.json();
      
      if (remote.images && remote.images[0].digest !== localSha) {
        updateAvailable = true;
      }
    } catch (e) {
      console.error("Docker Hub check failed:", e);
    }
  }

  return NextResponse.json({
    status: 'healthy',
    version: pkg.version,
    localSha,
    updateAvailable
  });
}