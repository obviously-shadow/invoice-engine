"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { ArrowLeft, Plus, X, Send, CheckCircle2, Package, DollarSign } from "lucide-react";

export default function MaterialBuilder({ 
  settings,
  initialReceipt,
  initialItems
}: { 
  settings: any,
  initialReceipt?: any,
  initialItems?: any[]
}) {
  const isEditing = !!initialReceipt;

  const mappedInitialItems = initialItems?.map(item => ({
    title: item.title,
    description: item.description,
    qty: item.qty,
    cost: item.cost, 
    uniqueId: Math.random()
  })) || [];

  const [activeItems, setActiveItems] = useState<any[]>(mappedInitialItems);
  const [clientName, setClientName] = useState(initialReceipt?.client_name || "");
  const [clientEmail, setClientEmail] = useState(initialReceipt?.client_email || "");
  const [clientAddress, setClientAddress] = useState(initialReceipt?.client_address || "");
  
  const [sourcingFee, setSourcingFee] = useState<string>(initialReceipt?.sourcing_fee?.toString() || "0");
  const [depositAmount, setDepositAmount] = useState<string>(initialReceipt?.deposit_amount?.toString() || "");

  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customCost, setCustomCost] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const baseCost = activeItems.reduce((sum, item) => sum + (item.cost * (item.qty || 1)), 0);
  const sourcingFeeAmount = parseFloat(sourcingFee) || 0;
  const subtotal = baseCost + sourcingFeeAmount;
  const hst = subtotal * (settings.tax_rate / 100);
  const total = subtotal + hst;

  const addCustomItem = () => {
    if (!customTitle || customCost === "") return;
    setActiveItems([...activeItems, { 
      title: customTitle, 
      description: customDesc,
      qty: parseFloat(customQty) || 1,
      cost: parseFloat(customCost), 
      uniqueId: Math.random()
    }]);
    setCustomTitle("");
    setCustomDesc("");
    setCustomQty("1");
    setCustomCost("");
  };

  const updateItemQty = (uniqueId: number, newQty: number) => {
    setActiveItems(activeItems.map(item => item.uniqueId === uniqueId ? { ...item, qty: newQty } : item));
  };

  const removeItem = (uniqueId: number) => {
    setActiveItems(activeItems.filter(item => item.uniqueId !== uniqueId));
  };

  const generateLink = async () => {
    if (!clientName.trim()) return alert("Please enter a Client/Job Name.");
    if (activeItems.length === 0) return alert("Please add at least one item.");

    setIsGenerating(true);
    try {
      const endpoint = isEditing ? `/api/materials/${initialReceipt.token}` : '/api/materials';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          client_name: clientName,
          client_email: clientEmail,
          client_address: clientAddress,
          items: activeItems, 
          tax_rate: settings.tax_rate,
          sourcing_fee: parseFloat(sourcingFee) || 0,
          deposit_amount: parseFloat(depositAmount) || 0,
          notes: initialReceipt?.notes || ""
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setGeneratedToken(isEditing ? initialReceipt.token : data.token);
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
    }
    setIsGenerating(false);
  };

  const handleCopyLink = () => {
    if (!generatedToken) return;
    const url = `${window.location.origin}/m/${generatedToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-500 mb-1 flex items-center gap-3">
              <Package className="w-7 h-7" />
              {isEditing ? "Edit Expense Report" : "Log Material Expense"}
            </h1>
            <p className="text-zinc-500 text-sm tracking-wide uppercase">{settings.company_name}</p>
          </div>
          <Link href="/admin/materials">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-10 px-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
        </header>

        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
          <div className="border-b border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Client or Job Name</label>
              <Input placeholder="e.g. 123 Main St Reno" value={clientName} onChange={e => setClientName(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 font-semibold text-lg h-12" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Email (Optional)</label>
                <Input placeholder="client@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 h-10" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Address (Optional)</label>
                <Input placeholder="123 Main St" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 h-10" />
              </div>
            </div>
          </div>
          
          <CardContent className="p-0 bg-zinc-900">
             <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/50">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-amber-500" /> Add Material / Hardware
                </h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <Input placeholder="Item Name (e.g. 2x4x8 Lumber)" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="col-span-3 bg-black border-zinc-700 text-zinc-100" />
                  <Input placeholder="Qty" type="number" step="any" value={customQty} onChange={e => setCustomQty(e.target.value)} className="col-span-1 bg-black border-zinc-700 text-zinc-100 text-center" />
                </div>
                <Input placeholder="Description or Store (e.g. Home Depot)" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 mb-3" />
                <div className="flex gap-3">
                  <Input 
                    placeholder="Cost per unit ($) - Use negative for returns" 
                    type="number" 
                    step="any"
                    value={customCost} 
                    onChange={e => setCustomCost(e.target.value)} 
                    className="bg-black border-zinc-700 text-zinc-100 font-mono" 
                  />
                  <Button onClick={addCustomItem} className="bg-amber-600 hover:bg-amber-500 text-black font-bold border-none px-8">Add Item</Button>
                </div>
             </div>

             <div className="p-6">
                {activeItems.length === 0 ? (
                  <div className="text-center text-zinc-500 opacity-60 py-8">
                    <p className="text-sm font-medium">Expense report is empty.</p>
                  </div>
                ) : (
                    <Table>
                      <TableBody>
                        {activeItems.map((item) => (
                          <TableRow key={item.uniqueId} className="border-zinc-800/50 hover:bg-zinc-800/30">
                            <TableCell className="font-medium text-zinc-200 py-4 align-top">
                              <span className="block leading-snug">{item.title}</span>
                              <span className="block text-[11px] text-zinc-500 mt-1">{item.description}</span>
                            </TableCell>
                            <TableCell className="pt-3 align-top w-[90px]">
                              <div className="flex flex-col gap-1 items-end">
                                <Input 
                                  type="number" 
                                  step="any"
                                  value={item.qty} 
                                  onChange={(e) => updateItemQty(item.uniqueId, parseFloat(e.target.value) || 0)}
                                  className="h-7 w-16 bg-black border-zinc-700 text-zinc-300 text-center text-xs" 
                                />
                                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Qty</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-zinc-300 font-mono text-sm pt-4 align-top w-[100px]">
                               ${(item.cost * item.qty).toFixed(2)}
                            </TableCell>
                            <TableCell className="pt-3 pr-3 align-top w-[40px]">
                              <button onClick={() => removeItem(item.uniqueId)} className="text-zinc-600 hover:text-red-400 p-1 transition-all bg-zinc-950 rounded border border-zinc-800 hover:border-red-900/50">
                                <X className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                )}
             </div>
          </CardContent>
          
          <CardFooter className="flex-col border-t border-zinc-800 bg-zinc-950 p-6">
            <div className="w-full space-y-3 text-sm mb-6">
              
              <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800 mb-2">
                 <Label className="text-zinc-300 flex items-center gap-2 font-bold"><DollarSign className="w-4 h-4 text-amber-500"/> Sourcing/Handling Fee</Label>
                 <Input type="number" step="0.01" value={sourcingFee} onChange={e => setSourcingFee(e.target.value)} className="w-28 bg-black border-zinc-700 text-white font-mono text-right" placeholder="0.00" />
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800 mb-4">
                 <Label className="text-zinc-300 flex items-center gap-2 font-bold"><DollarSign className="w-4 h-4 text-emerald-500"/> Required Deposit (Upfront)</Label>
                 <Input type="number" step="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-28 bg-black border-zinc-700 text-white font-mono text-right" placeholder="0.00" />
              </div>

              <div className="flex justify-between text-zinc-400 font-medium pt-2">
                <span>Total Material Cost</span><span className="font-mono text-zinc-300">${baseCost.toFixed(2)}</span>
              </div>
              {parseFloat(sourcingFee) > 0 && (
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>Sourcing Fee</span><span className="font-mono text-amber-400">${sourcingFeeAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400 font-medium pb-4 border-b border-zinc-800/50 mb-4">
                <span>Tax ({settings.tax_rate}%)</span><span className="font-mono text-zinc-300">${hst.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-end text-zinc-100 font-bold pt-2 border-t border-zinc-800">
                <span className="text-base text-zinc-400">Total Amount Due</span>
                <span className="font-mono text-2xl tracking-tight text-amber-500">
                    ${total.toFixed(2)}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={generateLink} 
              disabled={isGenerating || activeItems.length === 0}
              className="w-full bg-amber-600 hover:bg-amber-500 text-black h-14 text-lg font-bold shadow-lg shadow-amber-900/20"
            >
              {isGenerating ? "Processing..." : <><Send className="w-5 h-5 mr-2" /> {isEditing ? "Update Report" : "Generate Report Link"}</>}
            </Button>
          </CardFooter>
        </Card>

        <Dialog open={!!generatedToken} onOpenChange={() => {
          setGeneratedToken(null);
          window.location.href = '/admin/materials';
        }}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md p-0 overflow-hidden shadow-2xl">
            <DialogDescription className="sr-only">Receipt Link Generated</DialogDescription>
            <div className="bg-amber-500/10 p-8 pb-6 border-b border-zinc-800 text-center">
              <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-amber-400" />
              </div>
              <DialogTitle className="text-2xl font-bold">Report {isEditing ? "Updated" : "Generated"}</DialogTitle>
            </div>
            
            <div className="p-6 space-y-5 bg-zinc-950">
              <div className="border border-zinc-700 bg-black rounded-lg p-4 text-sm font-mono truncate text-zinc-300 select-all">
                {generatedToken ? `${window.location.origin}/m/${generatedToken}` : ''}
              </div>
              <Button onClick={handleCopyLink} className="w-full bg-amber-500 text-black h-12 font-bold hover:bg-amber-400">
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}