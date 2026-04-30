import db from "@/lib/db";
import InvoiceBuilder from "@/components/admin/InvoiceBuilder";

export const dynamic = 'force-dynamic';

async function getData(editToken?: string) {
  const templates = db.prepare('SELECT * FROM job_templates').all();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  
  // Explicitly set these to undefined and define their types so the Next.js build compiler doesn't panic
  let initialInvoice: any = undefined;
  let initialItems: any[] | undefined = undefined;

  if (editToken) {
    initialInvoice = db.prepare("SELECT * FROM invoices WHERE token = ? AND status = 'draft'").get(editToken);
    if (initialInvoice) {
      initialItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all((initialInvoice as any).id) as any[];
    }
  }

  return { templates, settings, initialInvoice, initialItems };
}

export default async function BuilderPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const resolvedParams = await searchParams;
  const data = await getData(resolvedParams.edit);
  
  return (
    <InvoiceBuilder 
      templates={data.templates} 
      settings={data.settings} 
      initialInvoice={data.initialInvoice}
      initialItems={data.initialItems}
    />
  );
}