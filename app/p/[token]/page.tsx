import db from "@/lib/db";
import ClientInvoice from "@/components/client/ClientInvoice";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getInvoiceData(token: string) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE token = ?').get(token) as any;
  if (!invoice) return null;

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const payments = db.prepare('SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY recorded_at ASC').all(invoice.id);
  
  return { invoice, items, settings, payments };
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const data = getInvoiceData(resolvedParams.token);

  if (!data || !data.invoice) {
    notFound();
  }

  if (data.invoice.is_archived === 1) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 selection:bg-zinc-300">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-zinc-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 border-4 border-white shadow-sm text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 mb-3">Document Voided</h1>
          <p className="text-zinc-600 font-medium leading-relaxed">This document has been removed or voided by the issuer and is no longer accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <ClientInvoice 
      invoice={data.invoice} 
      items={data.items} 
      settings={data.settings} 
      payments={data.payments}
    />
  );
}