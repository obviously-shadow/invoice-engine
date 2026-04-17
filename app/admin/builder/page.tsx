import db from "@/lib/db";
import InvoiceBuilder from "@/components/admin/InvoiceBuilder";

function getData() {
  const templates = db.prepare('SELECT * FROM job_templates').all();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  return { templates, settings };
}

export default function BuilderPage() {
  const data = getData();
  return <InvoiceBuilder templates={data.templates} settings={data.settings} />;
}