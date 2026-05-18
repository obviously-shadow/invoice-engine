"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, Plus, ExternalLink, Edit2, Trash2, Check, Copy } from "lucide-react";

export default function MaterialsLedger() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => {
        setReceipts(data.receipts || []);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (token: string) => {
    if (!confirm("Are you sure you want to delete this material receipt?")) return;
    await fetch(`/api/materials/${token}`, { method: 'DELETE' });
    setReceipts(receipts.filter(r => r.token !== token));
  };

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/m/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter text-amber-500 mb-1 flex items-center gap-3">
              <Package className="w-8 h-8" /> Material Tracker
            </h1>
            <p className="text-zinc-400 text-lg">Pass-through billing and expense reports.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 h-11 px-5">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Ledger
              </Button>
            </Link>
            <Link href="/admin/materials/builder">
              <Button className="bg-amber-600 hover:bg-amber-500 text-black font-bold h-11 px-6 shadow-lg shadow-amber-900/20">
                <Plus className="w-5 h-5 mr-2" /> Log Expense
              </Button>
            </Link>
          </div>
        </header>

        <Card className="bg-zinc-900 border-amber-900/30 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-amber-950/10 pb-5">
            <CardTitle className="text-xl text-amber-400 flex items-center gap-2">
              Recent Expense Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent bg-black/40">
                  <TableHead className="text-zinc-500 font-semibold h-12 w-20">Doc #</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Date</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Client / Job</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12">Grand Total</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                   <TableRow><TableCell colSpan={5} className="text-center py-16 text-zinc-500">Loading...</TableCell></TableRow>
                )}
                {!loading && receipts.map((receipt) => {
                  const displayId = receipt.display_number ? receipt.display_number : receipt.id.toString().padStart(6, '0');
                  
                  const baseCost = receipt.total_cost || 0;
                  const markup = baseCost * ((receipt.markup_percentage || 0) / 100);
                  const subtotal = baseCost + markup;
                  const tax = subtotal * ((receipt.tax_rate || 13) / 100);
                  const grandTotal = subtotal + tax;

                  return (
                  <TableRow key={receipt.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs py-5 pl-4">
                      #{displayId}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-300 py-5" suppressHydrationWarning>
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-200">
                      {receipt.client_name}
                    </TableCell>
                    <TableCell className="text-right text-amber-400 font-mono text-base font-bold">
                      ${grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right pr-4 flex justify-end items-center gap-1 mt-3">
                      <Link href={`/admin/materials/builder?edit=${receipt.token}`}>
                        <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 h-8 w-8" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(receipt.token)} className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(receipt.token)} className="text-zinc-400 hover:text-white hover:bg-white/5 h-8 w-8" title="Copy Link">
                        {copiedToken === receipt.token ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Link href={`/m/${receipt.token}`} target="_blank">
                        <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 h-8 w-8" title="Open Client View">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )})}
                {!loading && receipts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-zinc-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-20 text-amber-500" />
                      <p className="text-lg">No material expenses logged yet.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}