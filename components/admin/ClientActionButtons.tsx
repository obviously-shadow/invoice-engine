"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Copy, Check, Edit2, Trash2, DollarSign, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientActionButtons({ 
  token, 
  status, 
  isArchived = false, 
  balance = 0 
}: { 
  token: string, 
  status: string, 
  isArchived?: boolean, 
  balance?: number 
}) {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(balance.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("");

  // Addendum State
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [scopeTitle, setScopeTitle] = useState("");
  const [scopeDesc, setScopeDesc] = useState("");
  const [scopePrice, setScopePrice] = useState("");
  const [scopeQty, setScopeQty] = useState("1");

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

  const handleLogPayment = async () => {
    setIsProcessing(true);
    const amt = parseFloat(paymentAmount) || 0;
    const isFinal = amt >= balance;

    try {
      await fetch(`/api/invoices/${token}/payments`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, method: paymentMethod, isFinal })
      });
      setIsPaymentModalOpen(false);
      router.refresh(); 
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleAddScope = async () => {
    if (!scopeTitle || scopePrice === "") return;
    setIsProcessing(true);
    try {
      await fetch(`/api/invoices/${token}/addendum`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: scopeTitle, description: scopeDesc, price: scopePrice, qty: scopeQty })
      });
      setIsScopeModalOpen(false);
      setScopeTitle(""); setScopeDesc(""); setScopePrice(""); setScopeQty("1");
      router.refresh(); 
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    const msg = isArchived 
      ? "Permanently delete this invoice? This cannot be undone." 
      : "Archive this invoice? This will revoke client access.";
    if (!confirm(msg)) return;
    setIsProcessing(true);
    try {
      await fetch(`/api/invoices/${token}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  return (
    <div className="flex justify-end gap-2 items-center">
      <Button 
        variant="ghost" size="icon-sm"
        onClick={() => router.push(`/admin/builder?edit=${token}`)}
        className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-8 w-8"
        title="Edit Document"
      >
        <Edit2 className="w-4 h-4" />
      </Button>
      
      <Button 
        variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isProcessing}
        className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
        title={isArchived ? "Permanently Delete" : "Archive Document"}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <Button 
        variant="ghost" onClick={handleCopy}
        className={`h-8 px-3 ml-1 text-xs font-medium transition-colors ${copied ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
      >
        {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
        {copied ? "Copied" : "Copy Link"}
      </Button>

      {(!isArchived && status !== 'paid' && status !== 'draft') && (
        <>
          <Button 
            onClick={() => setIsScopeModalOpen(true)} disabled={isProcessing}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 h-8 px-3 text-xs font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1 text-amber-500" /> Scope
          </Button>

          <Button 
            onClick={() => { setPaymentAmount(balance.toFixed(2)); setIsPaymentModalOpen(true); }} disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 px-4 text-xs font-bold shadow-sm shadow-emerald-900/50"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
          </Button>

          <Dialog open={isScopeModalOpen} onOpenChange={setIsScopeModalOpen}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2"><PlusCircle className="w-5 h-5 text-amber-500"/> Add Scope / Change Order</DialogTitle>
                <DialogDescription className="sr-only">Form to add new items to an active invoice without breaking the signature.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-xs text-zinc-400">This will safely append a new line item to the active project without breaking the client's original signature. Enter negative amounts for refunds/credits.</p>
                <div className="grid grid-cols-4 gap-3">
                  <Input placeholder="Item Title" value={scopeTitle} onChange={(e) => setScopeTitle(e.target.value)} className="col-span-3 bg-black border-zinc-700 text-white" />
                  <Input placeholder="Qty" type="number" step="any" value={scopeQty} onChange={(e) => setScopeQty(e.target.value)} className="col-span-1 bg-black border-zinc-700 text-white text-center" />
                </div>
                <Input placeholder="Detailed description..." value={scopeDesc} onChange={(e) => setScopeDesc(e.target.value)} className="bg-black border-zinc-700 text-white" />
                <div className="space-y-2">
                  <Label className="text-zinc-400 uppercase tracking-widest text-[10px]">Unit Price ($)</Label>
                  <Input type="number" step="any" value={scopePrice} onChange={(e) => setScopePrice(e.target.value)} className="bg-black border-zinc-700 text-white font-mono" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsScopeModalOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                <Button onClick={handleAddScope} disabled={isProcessing || !scopeTitle || scopePrice === ""} className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-6">
                  Add to Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Record Received Payment</DialogTitle>
                <DialogDescription className="sr-only">Form to input a payment received against the active balance.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 uppercase tracking-widest text-xs">Amount Received</Label>
                  <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="bg-black border-zinc-700 text-white text-lg font-mono h-12" />
                  <p className="text-xs text-zinc-500 font-medium">Outstanding Balance: ${balance.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 uppercase tracking-widest text-xs">Payment Method / Memo</Label>
                  <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="e.g. E-Transfer, Cash" className="bg-black border-zinc-700 text-white h-12" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                <Button onClick={handleLogPayment} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-6">Save Payment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}