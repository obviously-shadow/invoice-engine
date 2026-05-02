"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ExternalLink } from "lucide-react";

export default function UpdateBadge() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.updateAvailable) {
          setHasUpdate(true);
          setLatestVersion(data.latestVersion);
        }
      })
      .catch(() => {});
  }, []);

  if (!hasUpdate) return null;

  // Swapped the href to point to your main repo instead of the releases tab
  return (
    <a href="https://github.com/obviously-shadow/invoice-engine" target="_blank" rel="noopener noreferrer">
      <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold gap-1 cursor-pointer hover:bg-emerald-500/20 transition-colors" title={`Version ${latestVersion} is available. Click to view latest code.`}>
        <ArrowUpCircle className="w-3 h-3" /> v{latestVersion} Available <ExternalLink className="w-3 h-3 opacity-50 ml-1" />
      </Badge>
    </a>
  );
}