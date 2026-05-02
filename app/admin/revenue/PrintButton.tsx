"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <Button 
      onClick={() => window.print()} 
      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-5 shadow-lg shadow-emerald-900/20"
    >
      <Printer className="w-4 h-4 mr-2" /> Export to PDF
    </Button>
  );
}