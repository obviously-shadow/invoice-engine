import db from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PrintButton from "./PrintButton";

export const dynamic = 'force-dynamic';

function getRevenueData() {
  const invoices = db.prepare(`
    SELECT i.id, i.status, i.client_name, i.created_at, i.display_number, 
           SUM(items.total) as subtotal, i.tax_rate,
           (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id) as total_paid
    FROM invoices i
    LEFT JOIN invoice_items items ON i.id = items.invoice_id
    WHERE IFNULL(i.is_archived, 0) = 0
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `).all() as any[];

  const settings = db.prepare('SELECT company_name, business_number FROM settings WHERE id = 1').get() as any;

  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalTaxCollected = 0;

  const activeInvoices = invoices.filter(i => i.status !== 'draft');

  activeInvoices.forEach(i => {
      const sub = i.subtotal || 0;
      const tax = sub * (i.tax_rate / 100);
      const grand = sub + tax;
      const paid = i.total_paid || 0;

      totalCollected += paid;
      
      // Approximation for tax collected: portion of payment that is tax
      if (grand > 0) {
        totalTaxCollected += paid * (tax / grand);
      }
      totalOutstanding += Math.max(0, grand - paid);
  });

  const activeInvoicesWithPayments = invoices.filter(i => (i.total_paid || 0) > 0);

  return { 
    settings,
    invoicesWithPayments: activeInvoicesWithPayments,
    totalCollected,
    totalOutstanding,
    totalTaxCollected
  };
}

export default function RevenueReport() {
  const data = getRevenueData();
  const reportDate = new Date().toLocaleDateString();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html { 
            background: white !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
          .print-break-avoid { break-inside: avoid !important; }
          @page { margin: 1.5cm; size: landscape; }
        }
      `}} />

      <div className="min-h-screen bg-black print:bg-white text-zinc-50 print:text-black p-4 md:p-8 print:p-0 font-sans selection:bg-emerald-500/30">
        <div className="max-w-6xl mx-auto space-y-8 print:space-y-6">
          
          <header className="no-print flex justify-between items-end border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-emerald-500" /> Revenue & Tax Report
              </h1>
              <p className="text-zinc-500 text-sm tracking-wide uppercase">{data.settings.company_name}</p>
            </div>
            <div className="flex gap-3">
               <Link href="/admin">
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-11 px-5">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              </Link>
              <PrintButton />
            </div>
          </header>

          <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-black uppercase tracking-widest">{data.settings.company_name}</h1>
              <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest mt-1">Financial Ledger Summary</p>
              <div className="flex justify-between mt-4 text-xs font-mono">
                  <span>Generated: {reportDate}</span>
                  {data.settings.business_number && <span>BN: {data.settings.business_number}</span>}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print-break-avoid">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl print:bg-white print:border-zinc-300 print:shadow-none">
               <p className="text-xs font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-widest mb-2">Total Collected</p>
               <p className="text-3xl font-mono text-white print:text-black font-black tracking-tight">${data.totalCollected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl print:bg-white print:border-zinc-300 print:shadow-none">
               <p className="text-xs font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-widest mb-2">Estimated Tax Collected</p>
               <p className="text-3xl font-mono text-white print:text-black font-black tracking-tight">${data.totalTaxCollected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl print:bg-white print:border-zinc-300 print:shadow-none">
               <p className="text-xs font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-widest mb-2">Total Outstanding</p>
               <p className="text-3xl font-mono text-blue-400 print:text-black font-black tracking-tight">${data.totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>

          <div className="mt-12 print:mt-6">
             <h2 className="text-lg font-bold text-white print:text-black uppercase tracking-widest mb-4 border-b border-zinc-800 print:border-zinc-300 pb-2">Active Invoices Ledger</h2>
             <Table className="print:w-full">
              <TableHeader>
                <TableRow className="border-zinc-800 print:border-zinc-300 hover:bg-transparent">
                  <TableHead className="text-zinc-500 print:text-zinc-800 font-bold">Doc #</TableHead>
                  <TableHead className="text-zinc-500 print:text-zinc-800 font-bold">Date</TableHead>
                  <TableHead className="text-zinc-500 print:text-zinc-800 font-bold">Client</TableHead>
                  <TableHead className="text-right text-zinc-500 print:text-zinc-800 font-bold">Grand Total</TableHead>
                  <TableHead className="text-right text-zinc-500 print:text-zinc-800 font-bold">Tax Collected</TableHead>
                  <TableHead className="text-right text-zinc-500 print:text-zinc-800 font-bold">Total Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoicesWithPayments.map((inv) => {
                   const displayId = inv.display_number ? inv.display_number : inv.id.toString().padStart(6, '0');
                   const sub = inv.subtotal || 0;
                   const tax = sub * (inv.tax_rate / 100);
                   const grand = sub + tax;
                   const taxCollected = grand > 0 ? inv.total_paid * (tax / grand) : 0;

                   return (
                     <TableRow key={inv.id} className="border-zinc-800/50 print:border-zinc-200 hover:bg-zinc-900 print:hover:bg-transparent transition-colors break-inside-avoid">
                        <TableCell className="font-mono text-zinc-400 print:text-zinc-900">#{displayId}</TableCell>
                        <TableCell className="text-zinc-300 print:text-zinc-900" suppressHydrationWarning>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-zinc-100 print:text-black">{inv.client_name}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-300 print:text-black">${grand.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-400 print:text-zinc-600">${taxCollected.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-400 print:text-zinc-700">${inv.total_paid.toFixed(2)}</TableCell>
                     </TableRow>
                   )
                })}
                {data.invoicesWithPayments.length === 0 && (
                   <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-600 print:text-zinc-500">No paid invoices found.</TableCell></TableRow>
                )}
              </TableBody>
             </Table>
          </div>

        </div>
      </div>
    </>
  );
}