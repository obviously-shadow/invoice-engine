import db from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ClientActionButtons from "@/components/admin/ClientActionButtons";
import { Settings, Plus, FileText, AlertTriangle, Archive, TrendingUp, BarChart3, Package } from "lucide-react";
import UpdateBadge from "@/components/admin/UpdateBadge";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = 'force-dynamic';

function getDashboardData() {
  const invoices = db.prepare(`
    SELECT i.id, i.token, i.status, i.client_name, i.created_at, i.display_number, i.tax_rate,
           SUM(items.total) as subtotal,
           (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id) as total_paid
    FROM invoices i
    LEFT JOIN invoice_items items ON i.id = items.invoice_id
    WHERE IFNULL(i.is_archived, 0) = 0
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `).all();

  const collectedRevenueRow = db.prepare(`SELECT SUM(amount) as total FROM invoice_payments`).get() as any;
  const ytdRevenue = collectedRevenueRow?.total || 0;

  let outstandingRevenue = 0;
  
  invoices.forEach((inv: any) => {
    if (inv.status !== 'draft' && inv.status !== 'paid') {
      const sub = inv.subtotal || 0;
      const tax = sub * ((inv.tax_rate || 0) / 100);
      const grand = sub + tax;
      const paid = inv.total_paid || 0;
      if (grand > paid) {
        outstandingRevenue += (grand - paid);
      }
    }
  });

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  
  return { 
    invoices, 
    ytdRevenue, 
    outstandingRevenue,
    settings
  };
}

export default function AdminLedger() {
  const data = getDashboardData();
  const threshold = data.settings.tax_threshold || 30000;
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
            <Link href="/admin/archive">
              <Button variant="outline" className="bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 h-11 px-5">
                <Archive className="w-4 h-4 mr-2" /> Archive
              </Button>
            </Link>
            <Link href="/admin/materials">
              <Button variant="outline" className="bg-zinc-900 border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-11 px-5 transition-colors">
                <Package className="w-4 h-4 mr-2" /> Materials
              </Button>
            </Link>
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
            <LogoutButton />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/50 border-white/5 shadow-xl backdrop-blur-sm relative group">
            <Link href="/admin/revenue" className="absolute top-4 right-4 z-10 transition-opacity">
              <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs h-8 shadow-md">
                 <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> View Report
              </Button>
            </Link>
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Collected Revenue (YTD)</h3>
                  <div className="text-3xl font-mono text-white tracking-tight">${data.ytdRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
                  <AlertTriangle className="w-4 h-4" /> Approaching custom tracking threshold.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/5 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400"/> Outstanding Balance
                </h3>
                <div className="text-3xl font-mono text-blue-100 tracking-tight">${data.outstandingRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <p className="text-xs text-zinc-500 mt-2">Combined balance of all active Approved documents currently awaiting payment.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-black/20 pb-5">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-400" /> Active Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent bg-black/40">
                  <TableHead className="text-zinc-500 font-semibold h-12 w-20">Doc #</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Date</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Client</TableHead>
                  <TableHead className="text-zinc-500 font-semibold h-12">Status</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12">Balance</TableHead>
                  <TableHead className="text-right text-zinc-500 font-semibold h-12 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((invoice: any) => {
                  const displayId = invoice.display_number ? invoice.display_number : invoice.id.toString().padStart(6, '0');
                  
                  const subtotal = invoice.subtotal || 0;
                  const tax = subtotal * ((invoice.tax_rate || 13) / 100);
                  const grandTotal = subtotal + tax;
                  const balance = grandTotal - (invoice.total_paid || 0);

                  let badgeClass = '';
                  let displayStatus = invoice.status;

                  if (invoice.status === 'approved') {
                    badgeClass = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
                  } else if (invoice.status === 'partially_paid') {
                    badgeClass = 'border-blue-500/30 text-blue-400 bg-blue-500/10';
                    displayStatus = 'Partial';
                  } else if (invoice.status === 'paid') {
                    badgeClass = 'border-zinc-700 text-zinc-400 bg-zinc-800/50';
                  } else {
                    badgeClass = 'border-amber-500/30 text-amber-400 bg-amber-500/10';
                  }

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
                      <Badge variant="outline" className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${badgeClass}`}>
                        {displayStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-100 font-mono text-base">
                      ${Math.max(0, balance).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <ClientActionButtons 
                        token={invoice.token} 
                        status={invoice.status} 
                        isArchived={false} 
                        balance={Math.max(0, balance)} 
                      />
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