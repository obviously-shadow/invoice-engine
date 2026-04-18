"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Copy, Check, CheckCircle2 } from "lucide-react";

export default function ClientActionButtons({ token, status }: { token: string, status: string }) {
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const router = useRouter();

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
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = async () => {
    setIsPaying(true);
    try {
      await fetch(`/api/invoices/${token}/pay`, { method: 'POST' });
      router.refresh(); 
    } catch (error) {
      console.error(error);
    }
    setIsPaying(false);
  };

  return (
    <div className="flex justify-end gap-3 items-center">
      <Button 
        variant="ghost" 
        onClick={handleCopy}
        className={`h-8 px-3 text-xs font-medium transition-colors ${copied ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
      >
        {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
        {copied ? "Copied" : "Copy Link"}
      </Button>

      {status === 'approved' && (
        <Button 
          onClick={handleMarkPaid}
          disabled={isPaying}
          className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 px-4 text-xs font-bold shadow-sm shadow-emerald-900/50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          {isPaying ? "Processing..." : "Mark Paid"}
        </Button>
      )}
    </div>
  );
}