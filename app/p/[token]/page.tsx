import db from "@/lib/db";
import ClientInvoice from "@/components/client/ClientInvoice";
import { notFound } from "next/navigation";

// 1. Fetch the invoice securely based on the URL token
function getInvoiceData(token: string) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE token = ?').get(token);
  if (!invoice) return null;

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);
  return { invoice, items };
}

// 2. Next.js App Router dynamic page
export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const data = getInvoiceData(resolvedParams.token);

  // If someone types a random token, throw a 404 page
  if (!data) {
    notFound();
  }

  // Pass data to the interactive client component.
  // We hardcode the name for now, but this will eventually come from a 'settings' DB table.
  return (
    <ClientInvoice 
      invoice={data.invoice} 
      items={data.items} 
      companyName="Nepean Handyman Services" 
    />
  );
}