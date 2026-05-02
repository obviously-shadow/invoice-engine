"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ClaimForm({ companyName }: { companyName: string }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password must be at least 6 characters.");
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans selection:bg-amber-500/30">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security Upgrade</h1>
          <p className="text-zinc-400 font-medium">Protecting your existing ledger.</p>
        </div>

        <Card className="bg-zinc-900 border-amber-500/20 shadow-2xl shadow-amber-500/5">
          <form onSubmit={handleClaim}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white">Claim Your Database</CardTitle>
              <CardDescription className="text-zinc-400 text-base leading-relaxed">
                We've detected an existing database for <strong>{companyName}</strong>, but it is currently unprotected. Please create a Master Password to encrypt and lock your dashboard immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="New Master Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black border-zinc-800 text-white h-12 text-lg px-4"
                  autoFocus
                />
                <p className="text-xs text-zinc-500 mt-2 ml-1">Minimum 6 characters required.</p>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6">
              <Button 
                type="submit" 
                disabled={isLoading || password.length < 6}
                className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-black font-bold text-lg shadow-lg shadow-amber-900/20"
              >
                {isLoading ? "Securing..." : <><CheckCircle2 className="w-5 h-5 mr-2" /> Secure Dashboard</>}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}