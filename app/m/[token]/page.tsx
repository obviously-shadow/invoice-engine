import db from "@/lib/db";
import ClientMaterial from "@/components/client/ClientMaterial";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getMaterialData(token: string) {
  const receipt = db.prepare('SELECT * FROM material_receipts WHERE token = ?').get(token) as any;
  if (!receipt) return null;

  const items = db.prepare('SELECT * FROM material_items WHERE receipt_id = ?').all(receipt.id);
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  
  return { receipt, items, settings };
}

export default async function MaterialPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const data = getMaterialData(resolvedParams.token);

  if (!data || !data.receipt) {
    notFound();
  }

  if (data.receipt.is_archived === 1) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 selection:bg-zinc-300">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-zinc-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 border-4 border-white shadow-sm text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 mb-3">Receipt Voided</h1>
          <p className="text-zinc-600 font-medium leading-relaxed">This document has been removed by the issuer and is no longer accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <ClientMaterial 
      receipt={data.receipt} 
      items={data.items} 
      settings={data.settings} 
    />
  );
}