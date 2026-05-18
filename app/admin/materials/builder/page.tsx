import db from "@/lib/db";
import MaterialBuilder from "@/components/admin/MaterialBuilder";

export const dynamic = 'force-dynamic';

async function getMaterialData(editToken?: string) {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  
  let initialReceipt: any = undefined;
  let initialItems: any[] | undefined = undefined;

  if (editToken) {
    initialReceipt = db.prepare("SELECT * FROM material_receipts WHERE token = ?").get(editToken);
    if (initialReceipt) {
      initialItems = db.prepare('SELECT * FROM material_items WHERE receipt_id = ?').all((initialReceipt as any).id) as any[];
    }
  }

  return { settings, initialReceipt, initialItems };
}

export default async function MaterialBuilderPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const resolvedParams = await searchParams;
  const data = await getMaterialData(resolvedParams.edit);
  
  return (
    <MaterialBuilder 
      settings={data.settings} 
      initialReceipt={data.initialReceipt}
      initialItems={data.initialItems}
    />
  );
}