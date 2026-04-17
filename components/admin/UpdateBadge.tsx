"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle } from "lucide-react";

export default function UpdateBadge() {
  const [updateReady, setUpdateReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch('/api/health');
        const local = await res.json();

        // Don't show update warnings when coding locally on Windows
        if (local.localSha === "development") {
          setChecking(false);
          return;
        }

        // Fetch latest version fingerprint directly from Docker Hub
        const dockerRes = await fetch(`https://hub.docker.com/v2/repositories/${local.repo}/tags/latest`);
        const remote = await dockerRes.json();

        // If the live fingerprint doesn't match our local one, an update is ready
        if (remote.images && remote.images[0].digest !== local.localSha) {
          setUpdateReady(true);
        }
      } catch (e) {
        console.error("Update check failed", e);
      }
      setChecking(false);
    }

    checkVersion();
    
    // Check every 5 minutes
    const interval = setInterval(checkVersion, 300000);
    return () => clearInterval(interval);
  }, []);

  if (checking || !updateReady) return null;

  return (
    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 flex items-center gap-2 animate-pulse cursor-help" title="Watchtower will automatically install this update shortly.">
      <ArrowUpCircle className="w-4 h-4" />
      Update Available
    </Badge>
  );
}