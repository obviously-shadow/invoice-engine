"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";

export default function LoginForm({ companyName }: { companyName: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{companyName}</h1>
          <p className="text-zinc-500 font-medium">Invoice Centre</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
          <form onSubmit={handleLogin}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white">Secure Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Enter Password..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black border-zinc-800 text-white h-12 text-lg px-4"
                  autoFocus
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6">
              <Button 
                type="submit" 
                disabled={isLoading || !password}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-900/20"
              >
                {isLoading ? "Authenticating..." : <><ShieldCheck className="w-5 h-5 mr-2" /> Login</>}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}