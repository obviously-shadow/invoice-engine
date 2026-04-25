"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, CheckCircle2 } from "lucide-react";

export default function UpdateBadge() {
  const [data, setData] = useState({ current: '', latest: '', ready: false, loaded: false });

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch('/api/health');
        const json = await res.json();
        setData({ 
          current: json.currentVersion, 
          latest: json.latestVersion, 
          ready: json.updateAvailable, 
          loaded: true 
        });
      } catch (e) {
        // Silent fail
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, 600000); // Check every 10 mins
    return () => clearInterval(interval);
  }, []);

  if (!data.loaded) return null;

  if (data.ready) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 flex items-center gap-2 animate-pulse shadow-lg shadow-amber-500/10">
        <ArrowUpCircle className="w-3.5 h-3.5" />
        <span className="font-bold">Update v{data.latest} Available</span>
        <span className="text-amber-500/60 font-medium ml-1">(Current: v{data.current})</span>
      </Badge>
    );
  }

  return (
    <Badge className="bg-zinc-900 text-zinc-500 border border-zinc-800 px-3 py-1 flex items-center gap-2">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span className="font-medium">v{data.current} (Up to Date)</span>
    </Badge>
  );
}