"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Copy, Check, CheckCircle2, Edit2, Trash2 } from "lucide-react";

export default function ClientActionButtons({ token, status }: { token: string, status: string }) {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      try { document.execCommand('copy'); } catch (err) { }
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/invoices/${token}/pay`, { method: 'POST' });
      router.refresh(); 
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice? This will revoke client access.")) return;
    setIsProcessing(true);
    try {
      await fetch(`/api/invoices/${token}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  return (
    <div className="flex justify-end gap-2 items-center">
      
      {status === 'draft' && (
        <>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={() => router.push(`/admin/builder?edit=${token}`)}
            className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-8 w-8"
            title="Edit Document"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={handleDelete}
            disabled={isProcessing}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      )}

      <Button 
        variant="ghost" 
        onClick={handleCopy}
        className={`h-8 px-3 ml-1 text-xs font-medium transition-colors ${copied ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
      >
        {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
        {copied ? "Copied" : "Copy Link"}
      </Button>

      {status === 'approved' && (
        <Button 
          onClick={handleMarkPaid}
          disabled={isProcessing}
          className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 px-4 text-xs font-bold shadow-sm shadow-emerald-900/50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          {isProcessing ? "Processing..." : "Mark Paid"}
        </Button>
      )}
    </div>
  );
}