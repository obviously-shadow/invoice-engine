import db from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = db.prepare('SELECT is_setup, password_hash FROM settings WHERE id = 1').get() as any;

  if (!settings || settings.is_setup === 0) {
    redirect('/setup');
  }

  // The critical redirect for your live migration
  if (settings.is_setup === 1 && !settings.password_hash) {
    redirect('/claim');
  }

  return <>{children}</>;
}