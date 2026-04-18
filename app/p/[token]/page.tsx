import db from "@/lib/db";
import ClientInvoice from "@/components/client/ClientInvoice";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getInvoiceData(token: string) {
  // Use 'as any' to bypass the strict type check during the DB fetch
  const invoice = db.prepare('SELECT * FROM invoices WHERE token = ?').get(token) as any;
  if (!invoice) return null;

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  
  return { invoice, items, settings };
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const data = getInvoiceData(resolvedParams.token);

  if (!data || !data.invoice) {
    notFound();
  }

  return (
    <ClientInvoice 
      invoice={data.invoice} 
      items={data.items} 
      settings={data.settings} 
    />
  );
}