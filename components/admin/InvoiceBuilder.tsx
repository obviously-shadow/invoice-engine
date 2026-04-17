"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function InvoiceBuilder({ templates }: { templates: any[] }) {
  const [activeInvoice, setActiveInvoice] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const currentYTDRevenue = 24500; 
  const threshold = 30000;
  const percentToThreshold = (currentYTDRevenue / threshold) * 100;
  const isWarning = percentToThreshold > 80;

  const subtotal = activeInvoice.reduce((sum, item) => sum + (item.default_labor_hours * item.hourly_rate) + item.default_material_cost, 0);
  const hst = subtotal * 0.13;
  const total = subtotal + hst;

  const addJobToInvoice = (job: any) => {
    setActiveInvoice([...activeInvoice, { ...job, uniqueId: Math.random() }]);
  };

  const removeJob = (uniqueId: number) => {
    setActiveInvoice(activeInvoice.filter(item => item.uniqueId !== uniqueId));
  };

  const generateLink = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: activeInvoice, tax_rate: 13.00 })
      });
      const data = await res.json();
      
      if (data.success) {
        setGeneratedToken(data.token);
        setActiveInvoice([]); 
      }
    } catch (error) {
      console.error(error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    if (!generatedToken) return;
    const url = `${window.location.origin}/p/${generatedToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 font-sans">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Umar's Command Center</h1>
            <p className="text-zinc-400">Nepean Handyman Services</p>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">YTD Revenue (Pre-Tax)</span>
              <span className="font-mono text-zinc-300">${currentYTDRevenue.toLocaleString()} / $30,000</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isWarning ? 'bg-orange-500' : 'bg-emerald-500'} transition-all`} 
                style={{ width: `${percentToThreshold}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Job Bundles <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Tap to Add</Badge>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {templates.map((job) => (
                <Card 
                  key={job.id} 
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer active:scale-95"
                  onClick={() => addJobToInvoice(job)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base text-zinc-100">{job.title}</CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">
                      {job.default_labor_hours}h Labor • ${job.default_material_cost} Mat.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card className="bg-zinc-900 border-zinc-800 sticky top-6 shadow-2xl">
            <CardHeader className="border-b border-zinc-800 pb-4">
              <CardTitle className="text-lg text-white flex justify-between">
                Active Estimate
                {activeInvoice.length > 0 && <Badge className="bg-emerald-500 text-emerald-950">Draft</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeInvoice.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  Tap a job bundle to start building an estimate.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Job</TableHead>
                      <TableHead className="text-right text-zinc-400">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeInvoice.map((item) => (
                      <TableRow key={item.uniqueId} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="font-medium text-zinc-300 py-3">
                          {item.title}
                          <div className="text-xs text-zinc-500 mt-1">
                            {item.default_labor_hours}h @ ${item.hourly_rate}/h + ${item.default_material_cost} parts
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-zinc-300 font-mono">
                          ${((item.default_labor_hours * item.hourly_rate) + item.default_material_cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <button onClick={() => removeJob(item.uniqueId)} className="text-zinc-600 hover:text-red-400">✕</button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            
            {activeInvoice.length > 0 && (
              <CardFooter className="flex-col gap-4 border-t border-zinc-800 bg-zinc-950/50 p-4 rounded-b-xl">
                <div className="w-full space-y-1 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>HST (13%)</span>
                    <span className="font-mono">${hst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-800 mt-2">
                    <span>Total</span>
                    <span className="font-mono">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  onClick={generateLink} 
                  disabled={isGenerating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none h-12 text-lg"
                >
                  {isGenerating ? "Generating..." : "Generate Magic Link"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <Dialog open={!!generatedToken} onOpenChange={() => setGeneratedToken(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-emerald-400">Link Generated Successfully</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Your estimate is ready. Text or email this secure link to your client.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 border border-zinc-700 bg-zinc-950 rounded-md p-3 text-sm font-mono truncate text-zinc-300">
              {generatedToken ? `${window.location.origin}/p/${generatedToken}` : ''}
            </div>
          </div>
          <DialogFooter className="sm:justify-start mt-4">
            <Button type="button" onClick={copyToClipboard} className="w-full bg-white text-zinc-950 hover:bg-zinc-200">
              {copied ? "Copied to Clipboard!" : "Copy Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}