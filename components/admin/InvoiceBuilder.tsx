"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { ArrowLeft, Layers, Plus, X, Send, CheckCircle2, Tag } from "lucide-react";

export default function InvoiceBuilder({ templates, settings }: { templates: any[], settings: any }) {
  const [activeInvoice, setActiveInvoice] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  
  const [currentGroup, setCurrentGroup] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customPrice, setCustomPrice] = useState("");
  
  const [isTBD, setIsTBD] = useState(false);
  const [invoiceIsTBD, setInvoiceIsTBD] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const subtotal = activeInvoice.reduce((sum, item) => {
    if (item.is_tbd) return sum;
    if (item.isCustom) return sum + (item.price * (item.qty || 1));
    const baseRate = item.default_material_cost + (item.default_labor_hours * item.hourly_rate);
    return sum + (baseRate * (item.qty || 1));
  }, 0);
  
  const hasTbdItems = activeInvoice.some(item => item.is_tbd);
  const hst = subtotal * (settings.tax_rate / 100);
  const total = subtotal + hst;

  const addJobToInvoice = (job: any) => {
    setActiveInvoice([...activeInvoice, { 
      ...job, 
      uniqueId: Math.random(), 
      isCustom: false, 
      qty: 1, 
      is_tbd: false,
      group_name: currentGroup.trim() 
    }]);
  };

  const addCustomItem = () => {
    if (!customTitle || (!customPrice && !isTBD)) return;
    setActiveInvoice([...activeInvoice, { 
      title: customTitle, 
      description: customDesc,
      qty: parseFloat(customQty) || 1,
      price: isTBD ? 0 : parseFloat(customPrice), 
      uniqueId: Math.random(), 
      isCustom: true,
      is_tbd: isTBD,
      group_name: currentGroup.trim()
    }]);
    setCustomTitle("");
    setCustomDesc("");
    setCustomQty("1");
    setCustomPrice("");
    setIsTBD(false);
  };

  const updateItemQty = (uniqueId: number, newQty: number) => {
    if (newQty < 1) return;
    setActiveInvoice(activeInvoice.map(item => item.uniqueId === uniqueId ? { ...item, qty: newQty } : item));
  };

  const toggleItemTbd = (uniqueId: number) => {
    setActiveInvoice(activeInvoice.map(item => item.uniqueId === uniqueId ? { ...item, is_tbd: !item.is_tbd } : item));
  };

  const removeJob = (uniqueId: number) => {
    setActiveInvoice(activeInvoice.filter(item => item.uniqueId !== uniqueId));
  };

  const generateLink = async () => {
    if (!clientName.trim()) return alert("Please enter a Client Name.");
    if (activeInvoice.length === 0) return alert("Please add at least one item.");

    setIsGenerating(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          client_name: clientName,
          client_email: clientEmail,
          client_address: clientAddress,
          items: activeInvoice, 
          tax_rate: settings.tax_rate,
          notes: "",
          is_tbd: invoiceIsTBD
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setGeneratedToken(data.token);
      }
    } catch (error) {
      console.error(error);
    }
    setIsGenerating(false);
  };

  const handleCopyLink = () => {
    if (!generatedToken) return;
    const url = `${window.location.origin}/p/${generatedToken}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(textArea);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50 mb-1">Document Builder</h1>
            <p className="text-zinc-500 text-sm tracking-wide uppercase">{settings.company_name}</p>
          </div>
          <Link href="/admin">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-10 px-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Ledger
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-sm">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Section / Group Name
              </label>
              <Input 
                placeholder="e.g. Master Bedroom, Optional Extras..." 
                value={currentGroup} 
                onChange={e => setCurrentGroup(e.target.value)} 
                className="bg-black border-zinc-700 text-zinc-100 placeholder:text-zinc-600" 
              />
              <p className="text-[11px] text-zinc-500 mt-2">Any items added below will be categorized under this group.</p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" /> Service Library
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {templates.map((job) => (
                  <Card 
                    key={job.id} 
                    className="bg-black border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 transition-all cursor-pointer group active:scale-[0.99] shadow-none"
                    onClick={() => addJobToInvoice(job)}
                  >
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors">
                        {job.title}
                      </CardTitle>
                      <span className="text-zinc-500 text-xs font-mono">
                        ${(job.default_material_cost + (job.default_labor_hours * job.hourly_rate)).toFixed(2)}
                      </span>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 border-dashed mt-8 shadow-none">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-zinc-500" /> Custom Line Item
                  </h3>
                  <button 
                    onClick={() => setIsTBD(!isTBD)}
                    className={`text-[11px] px-2 py-1 rounded border font-bold uppercase tracking-wider transition-colors ${isTBD ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Variable (TBD)
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <Input placeholder="Service Title" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="col-span-3 bg-black border-zinc-700 text-zinc-100" />
                  <Input placeholder="Qty" type="number" value={customQty} onChange={e => setCustomQty(e.target.value)} className="col-span-1 bg-black border-zinc-700 text-zinc-100 text-center" />
                </div>
                <Input placeholder="Detailed description of the work" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="bg-black border-zinc-700 text-zinc-100" />
                
                <div className="flex gap-3">
                  <Input 
                    placeholder={isTBD ? "Price is Variable" : "Unit Price ($)"} 
                    type="number" 
                    disabled={isTBD}
                    value={isTBD ? "" : customPrice} 
                    onChange={e => setCustomPrice(e.target.value)} 
                    className="bg-black border-zinc-700 text-zinc-100 font-mono disabled:opacity-50" 
                  />
                  <Button onClick={addCustomItem} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-6"><Plus className="w-5 h-5" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-8 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
              
              <div className="border-b border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Bill To (Client Name)</label>
                  <Input placeholder="e.g. John Doe" value={clientName} onChange={e => setClientName(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 font-semibold text-lg h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Email</label>
                    <Input placeholder="john@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Address</label>
                    <Input placeholder="123 Main St" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="bg-black border-zinc-700 text-zinc-100 h-10" />
                  </div>
                </div>
              </div>
              
              <CardContent className="p-0 min-h-[300px] bg-zinc-900">
                {activeInvoice.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center h-full opacity-60 mt-12">
                    <Layers className="w-10 h-10 mb-3 text-zinc-700" />
                    <p className="text-sm font-medium">Document is empty.</p>
                    <p className="text-xs mt-1">Add items from the library or create custom lines.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
                    {Array.from(new Set(activeInvoice.map(item => item.group_name))).map(group => (
                      <div key={group} className="space-y-2">
                        {group && (
                          <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-md w-fit mb-3">
                            {group}
                          </h4>
                        )}
                        
                        <Table>
                          <TableBody>
                            {activeInvoice.filter(item => item.group_name === group).map((item) => (
                              <TableRow key={item.uniqueId} className="border-zinc-800/50 hover:bg-zinc-800/30 group">
                                <TableCell className="font-medium text-zinc-200 py-4 pl-3 align-top">
                                  <span className="block leading-snug">{item.title}</span>
                                  <span className="block text-[11px] text-zinc-500 mt-1 max-w-[200px] truncate">{item.isCustom ? item.description : 'Standard Service'}</span>
                                </TableCell>
                                
                                <TableCell className="pt-3 align-top w-[90px]">
                                  <div className="flex flex-col gap-1 items-end">
                                    <Input 
                                      type="number" 
                                      value={item.qty} 
                                      onChange={(e) => updateItemQty(item.uniqueId, parseInt(e.target.value) || 1)}
                                      className="h-7 w-16 bg-black border-zinc-700 text-zinc-300 text-center text-xs" 
                                    />
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Qty</span>
                                  </div>
                                </TableCell>

                                <TableCell className="text-right text-zinc-300 font-mono text-sm pt-4 align-top w-[100px]">
                                  {item.is_tbd ? (
                                    <button 
                                      onClick={() => toggleItemTbd(item.uniqueId)}
                                      className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded text-xs hover:bg-amber-500/20 font-bold transition-colors"
                                    >
                                      TBD
                                    </button>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      <span>${item.isCustom ? (item.price * item.qty).toFixed(2) : (((item.default_labor_hours * item.hourly_rate) + item.default_material_cost) * item.qty).toFixed(2)}</span>
                                      <button onClick={() => toggleItemTbd(item.uniqueId)} className="text-[10px] text-zinc-600 hover:text-zinc-400 mt-1 underline decoration-zinc-700">Set TBD</button>
                                    </div>
                                  )}
                                </TableCell>

                                <TableCell className="pt-3 pr-3 align-top w-[40px]">
                                  <button onClick={() => removeJob(item.uniqueId)} className="text-zinc-600 hover:text-red-400 p-1 transition-all bg-zinc-950 rounded border border-zinc-800 hover:border-red-900/50">
                                    <X className="w-4 h-4" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex-col border-t border-zinc-800 bg-zinc-950 p-6">
                
                <div className="w-full space-y-2 text-sm mb-6">
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Subtotal</span><span className="font-mono text-zinc-300">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Tax ({settings.tax_rate}%)</span><span className="font-mono text-zinc-300">${hst.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="space-y-0.5">
                      <p className="text-white font-bold text-sm">Force TBD Final Total</p>
                      <p className="text-xs text-zinc-500">Hide the numerical total and set the entire estimate to TBD.</p>
                    </div>
                    <button 
                      onClick={() => setInvoiceIsTBD(!invoiceIsTBD)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${invoiceIsTBD ? 'bg-amber-500' : 'bg-zinc-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${invoiceIsTBD ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end text-zinc-100 font-bold pt-4 border-t border-zinc-800 mt-3">
                    <span className="text-base text-zinc-400">Total {hasTbdItems && !invoiceIsTBD && <span className="text-amber-500 text-xs ml-2 font-normal uppercase tracking-widest">+ Variable Costs</span>}</span>
                    <span className="font-mono text-2xl tracking-tight">
                      {invoiceIsTBD ? (
                        <span className="text-amber-400 font-bold">TBD (Pending Specs)</span>
                      ) : (
                        <>${total.toFixed(2)} {hasTbdItems && <span className="text-amber-500 text-lg">+ TBD</span>}</>
                      )}
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={generateLink} 
                  disabled={isGenerating || activeInvoice.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-14 text-lg font-bold shadow-lg shadow-emerald-900/20"
                >
                  {isGenerating ? "Processing..." : <><Send className="w-5 h-5 mr-2" /> Generate Secure Link</>}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Dialog open={!!generatedToken} onOpenChange={() => {
          setGeneratedToken(null);
          window.location.href = '/admin';
        }}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md p-0 overflow-hidden shadow-2xl">
            <DialogDescription className="sr-only">Invoice Link Generated</DialogDescription>
            <div className="bg-emerald-500/10 p-8 pb-6 border-b border-zinc-800 text-center">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <DialogTitle className="text-2xl font-bold">Link Generated</DialogTitle>
            </div>
            
            <div className="p-6 space-y-5 bg-zinc-950">
              <div className="border border-zinc-700 bg-black rounded-lg p-4 text-sm font-mono truncate text-zinc-300 select-all">
                {generatedToken ? `${window.location.origin}/p/${generatedToken}` : ''}
              </div>
              <Button onClick={handleCopyLink} className="w-full bg-white text-zinc-950 h-12 font-bold">
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}