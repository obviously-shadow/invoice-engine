// app/admin/page.tsx
import db from "@/lib/db";
import InvoiceBuilder from "@/components/admin/InvoiceBuilder";

// 1. Fetch data securely on the server
function getTemplates() {
  const stmt = db.prepare('SELECT * FROM job_templates');
  return stmt.all();
}

export default function AdminPage() {
  // 2. Grab the live data
  const templates = getTemplates();

  // 3. Pass it to the interactive Client UI
  return <InvoiceBuilder templates={templates} />;
}