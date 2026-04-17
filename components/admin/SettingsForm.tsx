"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Save, Building2, Percent, ShieldCheck, FileText, Plus, Trash2, Mail, Phone, Globe, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SettingsForm({ initialSettings, initialTemplates }: { initialSettings: any, initialTemplates: any[] }) {
  const [formData, setFormData] = useState({
    company_name: initialSettings.company_name || "",
    business_number: initialSettings.business_number || "",
    business_phone: initialSettings.business_phone || "",
    business_email: initialSettings.business_email || "",
    business_website: initialSettings.business_website || "",
    business_address: initialSettings.business_address || "",
    tax_rate: initialSettings.tax_rate || 13.0,
    payment_terms: initialSettings.payment_terms || "Net 30",
    require_signature: Boolean(initialSettings.require_signature)
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  const router = useRouter();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tax_rate: parseFloat(formData.tax_rate.toString())
        })
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    }
    setIsSaving(false);
  };

  const handleAddService = async () => {
    if (!newServiceTitle || !newServicePrice) return;
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newServiceTitle,
          description: newServiceDesc,
          default_labor_hours: 0,
          default_material_cost: parseFloat(newServicePrice),
          hourly_rate: 0
        })
      });
      setNewServiceTitle("");
      setNewServiceDesc("");
      setNewServicePrice("");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (id: number) => {
    await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="space-y-8 pb-12">
      <Card className="bg-zinc-900 border-white/10 text-white shadow-2xl">
        <CardHeader className="border-b border-zinc-800 pb-6">
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-zinc-400" />
            Company Identity
          </CardTitle>
          <CardDescription className="text-zinc-400 text-base">This formats your PDF printouts exactly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-zinc-300">Business Name</Label>
              <Input value={formData.company_name} onChange={(e) => handleChange('company_name', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Tax/Business Number</Label>
              <Input value={formData.business_number} onChange={(e) => handleChange('business_number', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone</Label>
              <Input value={formData.business_phone} onChange={(e) => handleChange('business_phone', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2"><Mail className="w-4 h-4"/> Email</Label>
              <Input value={formData.business_email} onChange={(e) => handleChange('business_email', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-zinc-300 flex items-center gap-2"><MapPin className="w-4 h-4"/> Physical Address</Label>
              <Input value={formData.business_address} placeholder="123 Main St, Ottawa, ON K2J 1A1" onChange={(e) => handleChange('business_address', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-zinc-300 flex items-center gap-2"><Globe className="w-4 h-4"/> Website</Label>
              <Input value={formData.business_website} onChange={(e) => handleChange('business_website', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800">
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2"><Percent className="w-4 h-4" /> Tax Rate (%)</Label>
              <Input type="number" step="0.1" value={formData.tax_rate} onChange={(e) => handleChange('tax_rate', e.target.value)} className="bg-black border-white/10 text-white font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2"><FileText className="w-4 h-4" /> Payment Terms</Label>
              <Input value={formData.payment_terms} onChange={(e) => handleChange('payment_terms', e.target.value)} className="bg-black border-white/10 text-white" />
            </div>
          </div>

          <div className="p-4 bg-black border border-zinc-800 rounded-lg flex items-center justify-between">
            <div className="pr-4">
              <Label className="text-white font-bold text-base flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Require Signature
              </Label>
              <p className="text-sm text-zinc-500">Block estimate approval without a signature.</p>
            </div>
            <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0">
              <button 
                onClick={() => handleChange('require_signature', false)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!formData.require_signature ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-500'}`}
              >
                Optional
              </button>
              <button 
                onClick={() => handleChange('require_signature', true)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${formData.require_signature ? 'bg-emerald-600 text-white' : 'bg-transparent text-zinc-500'}`}
              >
                Required
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-800 pt-6 bg-zinc-950/50">
          <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200 font-bold w-full h-12 text-lg">
            <Save className="w-5 h-5 mr-2" /> {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="border-b border-zinc-800 pb-6">
          <CardTitle className="text-xl">Service Catalog</CardTitle>
          <CardDescription className="text-zinc-400">Manage the reusable job bundles shown in your estimate builder.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Service Name</TableHead>
                <TableHead className="text-right text-zinc-400">Base Price</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialTemplates.map((template) => (
                <TableRow key={template.id} className="border-zinc-800">
                  <TableCell className="font-medium text-zinc-200">{template.title}</TableCell>
                  <TableCell className="text-right font-mono text-zinc-300">
                    ${(template.default_material_cost + (template.default_labor_hours * template.hourly_rate)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-red-400" onClick={() => handleDeleteService(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input placeholder="Service Title" value={newServiceTitle} onChange={e => setNewServiceTitle(e.target.value)} className="md:col-span-2 bg-black border-zinc-800 text-white" />
              <Input placeholder="Flat Price ($)" type="number" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="bg-black border-zinc-800 font-mono text-white" />
              <Button onClick={handleAddService} className="bg-zinc-800 hover:bg-zinc-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}