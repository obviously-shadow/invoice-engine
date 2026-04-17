"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ClientCopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleCopy}
      className={copied ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-400 hover:text-white"}
    >
      {copied ? "Copied!" : "Copy URL"}
    </Button>
  );
}