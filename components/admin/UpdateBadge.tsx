"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle } from "lucide-react";

export default function UpdateBadge() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setUpdateReady(data.updateAvailable);
      } catch (e) {
        // Silent fail for UI
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, 600000); // Check every 10 mins
    return () => clearInterval(interval);
  }, []);

  if (!updateReady) return null;

  return (
    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 flex items-center gap-2 animate-pulse cursor-help">
      <ArrowUpCircle className="w-3 h-3" />
      Update Available
    </Badge>
  );
}