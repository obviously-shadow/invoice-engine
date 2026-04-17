import db from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SettingsForm from "@/components/admin/SettingsForm";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const templates = db.prepare('SELECT * FROM job_templates').all();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Settings</h1>
          </div>
          <Link href="/admin">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 h-10 px-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
        </header>
        
        <SettingsForm initialSettings={settings} initialTemplates={templates} />
      </div>
    </div>
  );
}