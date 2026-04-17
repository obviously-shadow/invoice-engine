"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ClientInvoice({ invoice, items, companyName }: { invoice: any, items: any[], companyName: string }) {
  const [status, setStatus] = useState(invoice.status);
  const [isApproving, setIsApproving] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.unit_price, 0);
  const hst = subtotal * (invoice.tax_rate / 100);
  const total = subtotal + hst;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.token}/approve`, { method: 'POST' });
      if (res.ok) {
        setStatus('approved');
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    }
    setIsApproving(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 p-4 sm:p-6 font-sans flex justify-center">
      <div className="w-full max-w-2xl mt-8">
        
        {/* State-Shifting Banner */}
        {status === 'approved' && (
          <div className="mb-6 p-4 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 flex justify-between items-center">
            <span className="font-medium">✅ Estimate Approved</span>
            <span className="text-sm">We will begin work shortly.</span>
          </div>
        )}

        <Card className="shadow-xl border-zinc-200">
          <CardHeader className="border-b border-zinc-100 pb-6 bg-white rounded-t-xl">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{companyName}</h1>
                <p className="text-zinc-500 text-sm mt-1">Official Estimate</p>
              </div>
              <Badge variant={status === 'approved' ? 'default' : 'secondary'} className={status === 'approved' ? 'bg-emerald-500' : 'bg-zinc-200 text-zinc-700'}>
                {status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead className="text-zinc-500">Description</TableHead>
                  <TableHead className="text-right text-zinc-500">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium py-4">{item.description}</TableCell>
                    <TableCell className="text-right font-mono">${item.unit_price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          
          <CardFooter className="flex-col gap-6 border-t border-zinc-100 bg-zinc-50 p-6 rounded-b-xl">
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>HST ({invoice.tax_rate}%)</span>
                <span className="font-mono">${hst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-900 font-bold text-xl pt-4 border-t border-zinc-200 mt-2">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* The Magic Button */}
            {status === 'draft' && (
              <Button 
                onClick={handleApprove} 
                disabled={isApproving}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 text-lg rounded-xl shadow-lg transition-transform active:scale-[0.98]"
              >
                {isApproving ? "Processing..." : "Approve & Sign"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}