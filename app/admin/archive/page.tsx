import db from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ClientActionButtons from "@/components/admin/ClientActionButtons";
import { ArrowLeft, ArchiveX } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = 'force-dynamic';

function getArchivedData() {
  const invoices = db.prepare(`
    SELECT i.id, i.token, i.status, i.client_name, i.created_at, i.display_number, 
           SUM(items.total) as subtotal
    FROM invoices i
    LEFT JOIN invoice_items items ON i.id = items.invoice_id
    WHERE i.is_archived = 1
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `).all();
  
  return invoices;
}

export default function ArchiveLedger() {
  const invoices = getArchivedData();

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Archived Documents</h1>
            <p className="text-zinc-500 text-sm">Deleted estimates and invoices.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 h-10 px-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </header>

        <Card className="bg-zinc-900 border-red-900/30 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-red-950/10 pb-5">
            <CardTitle className="text-xl text-red-400 flex items-center gap-2">
              <ArchiveX className="w-5 h-5" /> Voided Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent bg-black/40">
                  <TableHead className="text-zinc-500 font-semibold h-12 w-20">Doc #</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Date Created</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Client</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Original Status</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12">Amount</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => {
                  const displayId = invoice.display_number ? invoice.display_number : invoice.id.toString().padStart(6, '0');
                  return (
                  <TableRow key={invoice.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs py-5 pl-4">
                      #{displayId}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-400 py-5" suppressHydrationWarning>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-400">
                      {invoice.client_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="px-2.5 py-1 text-xs font-bold tracking-wide uppercase border-zinc-700 text-zinc-500 bg-zinc-800/50">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-400 font-mono text-base">
                      ${invoice.subtotal ? invoice.subtotal.toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <ClientActionButtons token={invoice.token} status={invoice.status} isArchived={true} />
                    </TableCell>
                  </TableRow>
                )})}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-zinc-500">
                      <ArchiveX className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg">Archive is empty.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}