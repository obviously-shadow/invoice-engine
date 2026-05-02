"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleLogout} 
      className="bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 h-11 px-5 transition-colors"
    >
      <LogOut className="w-4 h-4 mr-2" /> Logout
    </Button>
  );
}