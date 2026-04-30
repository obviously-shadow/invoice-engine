import db from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ClientActionButtons from "@/components/admin/ClientActionButtons";
import { Settings, Plus, FileText, AlertTriangle } from "lucide-react";
import UpdateBadge from "@/components/admin/UpdateBadge";

export const dynamic = 'force-dynamic';

function getDashboardData() {
  const invoices = db.prepare(`
    SELECT i.id, i.token, i.status, i.client_name, i.created_at, i.display_number, 
           SUM(items.total) as subtotal
    FROM invoices i
    LEFT JOIN invoice_items items ON i.id = items.invoice_id
    WHERE IFNULL(i.is_archived, 0) = 0
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `).all();

  const revenueRow = db.prepare(`
    SELECT SUM(items.total) as total 
    FROM invoices i 
    JOIN invoice_items items ON i.id = items.invoice_id 
    WHERE i.status = 'paid' AND IFNULL(i.is_archived, 0) = 0
  `).get() as any;

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  
  return { 
    invoices, 
    ytdRevenue: revenueRow?.total || 0, 
    settings
  };
}

export default function AdminLedger() {
  const data = getDashboardData();
  const threshold = 30000;
  const percentToThreshold = (data.ytdRevenue / threshold) * 100;
  const isWarning = percentToThreshold > 80;

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tighter text-white mb-1">Command Ledger</h1>
              <UpdateBadge />
            </div>
            <p className="text-zinc-400 text-lg">{data.settings.company_name}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/settings">
              <Button variant="outline" className="bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 h-11 px-5">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Button>
            </Link>
            <Link href="/admin/builder">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-6 shadow-lg shadow-emerald-900/20">
                <Plus className="w-5 h-5 mr-2" /> New Estimate
              </Button>
            </Link>
          </div>
        </header>

        <Card className="bg-zinc-900/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-end mb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">YTD Revenue (Paid, Pre-Tax)</h3>
                <div className="text-3xl font-mono text-white tracking-tight">${data.ytdRevenue.toLocaleString()}</div>
              </div>
              <span className="text-sm font-mono text-zinc-500">Target: ${threshold.toLocaleString()}</span>
            </div>
            <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-1000 ease-out`} 
                style={{ width: `${Math.min(percentToThreshold, 100)}%` }}
              />
            </div>
            {isWarning && (
              <p className="flex items-center gap-2 text-sm text-amber-400 mt-3 font-medium">
                <AlertTriangle className="w-4 h-4" /> Approaching CRA GST/HST registration threshold.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-black/20 pb-5">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-400" /> Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent bg-black/40">
                  <TableHead className="text-zinc-500 font-semibold h-12 w-20">Doc #</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Date Created</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Client</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Status</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12">Amount</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((invoice: any) => {
                  const displayId = invoice.display_number ? invoice.display_number : invoice.id.toString().padStart(6, '0');
                  return (
                  <TableRow key={invoice.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs py-5 pl-4">
                      #{displayId}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-300 py-5" suppressHydrationWarning>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-200">
                      {invoice.client_name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${
                          invoice.status === 'approved' 
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                          invoice.status === 'paid'
                            ? 'border-zinc-700 text-zinc-300 bg-zinc-800/50'
                            : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-100 font-mono text-base">
                      ${invoice.subtotal ? invoice.subtotal.toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <ClientActionButtons token={invoice.token} status={invoice.status} />
                    </TableCell>
                  </TableRow>
                )})}
                {data.invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-zinc-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg">No documents generated yet.</p>
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