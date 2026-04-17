"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Building2, Percent, ShieldCheck, FileText } from "lucide-react";

export default function SetupWizard() {
  const [companyName, setCompanyName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [taxRate, setTaxRate] = useState("13.0");
  const [paymentTerms, setPaymentTerms] = useState("Due on receipt");
  const [requireSignature, setRequireSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();

  const handleCompleteSetup = async () => {
    if (!companyName.trim()) {
      alert("Please enter a business name.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_name: companyName, 
          business_number: businessNumber,
          tax_rate: parseFloat(taxRate), 
          payment_terms: paymentTerms,
          require_signature: requireSignature 
        })
      });
      
      if (res.ok) {
        router.push('/admin');
      }
    } catch (error) {
      console.error(error);
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl relative z-10 my-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Configuration</h1>
          <p className="text-zinc-400">Set up your business profile for client documents.</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
          <CardHeader className="border-b border-zinc-800 pb-6">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-zinc-400" /> Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-zinc-300">Business Name</Label>
                <Input 
                  id="companyName" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessNumber" className="text-zinc-300">Tax/Business Number (Optional)</Label>
                <Input 
                  id="businessNumber" 
                  placeholder="e.g. RT-123456"
                  value={businessNumber} 
                  onChange={(e) => setBusinessNumber(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-zinc-300 flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Default Tax Rate
                </Label>
                <Input 
                  id="taxRate" 
                  type="number"
                  step="0.1"
                  value={taxRate} 
                  onChange={(e) => setTaxRate(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms" className="text-zinc-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Payment Terms
                </Label>
                <Input 
                  id="paymentTerms" 
                  placeholder="e.g. Net 15, Due on Receipt"
                  value={paymentTerms} 
                  onChange={(e) => setPaymentTerms(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
              <div className="pr-4">
                <Label className="text-white font-bold text-base flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Client Signatures
                </Label>
                <p className="text-sm text-zinc-500 leading-relaxed">Require a digital signature before an estimate can be approved.</p>
              </div>
              <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0">
                <button 
                  onClick={() => setRequireSignature(false)}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!requireSignature ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-500'}`}
                >
                  Optional
                </button>
                <button 
                  onClick={() => setRequireSignature(true)}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${requireSignature ? 'bg-emerald-600 text-white' : 'bg-transparent text-zinc-500'}`}
                >
                  Required
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-zinc-800 pt-6">
            <Button 
              onClick={handleCompleteSetup} 
              disabled={isSaving || !companyName.trim()}
              className="w-full bg-white text-black hover:bg-zinc-200 h-12 font-bold"
            >
              {isSaving ? "Saving..." : "Complete Setup"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}