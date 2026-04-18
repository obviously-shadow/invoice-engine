"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ClientCopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/p/${token}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {}
      document.body.removeChild(textArea);
    }
    
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