"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import { ArrowLeft, Copy, Layers, Plus, X, Send, CheckCircle2 } from "lucide-react";

export default function InvoiceBuilder({ templates, settings }: { templates: any[], settings: any }) {
  const [activeInvoice, setActiveInvoice] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const subtotal = activeInvoice.reduce((sum, item) => {
    if (item.isCustom) return sum + item.price;
    return sum + (item.default_labor_hours * item.hourly_rate) + item.default_material_cost;
  }, 0);
  
  const hst = subtotal * (settings.tax_rate / 100);
  const total = subtotal + hst;

  const addJobToInvoice = (job: any) => {
    setActiveInvoice([...activeInvoice, { ...job, uniqueId: Math.random(), isCustom: false }]);
  };

  const addCustomItem = () => {
    if (!customTitle || !customPrice) return;
    setActiveInvoice([...activeInvoice, { 
      title: customTitle, 
      description: customDesc,
      price: parseFloat(customPrice), 
      uniqueId: Math.random(), 
      isCustom: true 
    }]);
    setCustomTitle("");
    setCustomDesc("");
    setCustomPrice("");
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
          tax_rate: settings.tax_rate 
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
          
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Service Library
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((job) => (
                <Card 
                  key={job.id} 
                  className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all cursor-pointer group active:scale-[0.98] shadow-md"
                  onClick={() => addJobToInvoice(job)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                      {job.title}
                    </CardTitle>
                    <p className="text-zinc-400 text-xs mt-2 font-mono bg-zinc-950 inline-block px-2 py-1 rounded-md border border-zinc-800 w-fit">
                      ${(job.default_material_cost + (job.default_labor_hours * job.hourly_rate)).toFixed(2)}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800 border-dashed mt-8 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-zinc-500" /> Custom Line Item
                </h3>
                <Input placeholder="Service Title" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="bg-zinc-950 border-zinc-700 text-zinc-100" />
                <Input placeholder="Description details (optional)" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="bg-zinc-950 border-zinc-700 text-zinc-100" />
                <div className="flex gap-3">
                  <Input placeholder="Price ($)" type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono" />
                  <Button onClick={addCustomItem} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-6"><Plus className="w-5 h-5" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
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
              
              <CardContent className="p-0 min-h-[250px] bg-zinc-900">
                {activeInvoice.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center h-full opacity-60">
                    <Layers className="w-10 h-10 mb-3 text-zinc-700" />
                    <p className="text-sm font-medium">Document is empty.</p>
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {activeInvoice.map((item) => (
                        <TableRow key={item.uniqueId} className="border-zinc-800 hover:bg-zinc-800/50 group">
                          <TableCell className="font-medium text-zinc-200 py-4 pl-6 align-top">
                            <span className="block leading-snug">{item.title}</span>
                            <span className="block text-xs text-zinc-500 mt-1">{item.isCustom ? item.description : 'Standard Service Profile'}</span>
                          </TableCell>
                          <TableCell className="text-right text-zinc-300 font-mono text-sm pt-4 align-top">
                            ${item.isCustom ? item.price.toFixed(2) : ((item.default_labor_hours * item.hourly_rate) + item.default_material_cost).toFixed(2)}
                          </TableCell>
                          <TableCell className="pt-3 pr-4 align-top w-[50px]">
                            <button onClick={() => removeJob(item.uniqueId)} className="text-zinc-500 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              
              <CardFooter className="flex-col gap-5 border-t border-zinc-800 bg-zinc-950 p-6">
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Subtotal</span><span className="font-mono text-zinc-300">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Tax ({settings.tax_rate}%)</span><span className="font-mono text-zinc-300">${hst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end text-zinc-100 font-bold pt-4 border-t border-zinc-800 mt-3">
                    <span className="text-base text-zinc-400">Total</span>
                    <span className="font-mono text-2xl tracking-tight">${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={generateLink} 
                  disabled={isGenerating || activeInvoice.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-14 text-lg font-bold mt-2"
                >
                  {isGenerating ? "Processing..." : <><Send className="w-5 h-5 mr-2" /> Generate Secure Link</>}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Dialog open={!!generatedToken} onOpenChange={() => {
          setGeneratedToken(null);
          window.location.href = '/admin'; // Force back to ledger after close
        }}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md p-0 overflow-hidden shadow-2xl">
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
              <Button onClick={() => {
                if (!generatedToken) return;
                navigator.clipboard.writeText(`${window.location.origin}/p/${generatedToken}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} className="w-full bg-white text-zinc-950 h-12 font-bold">
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}