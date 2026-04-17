import db from "@/lib/db";
import { redirect } from "next/navigation";

// This layout wraps EVERY page inside the /admin folder. 
// It runs securely on the server before the page even loads.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  
  // 1. Check the database
  const settings = db.prepare('SELECT is_setup FROM settings WHERE id = 1').get() as any;

  // 2. If the row is missing or is_setup is 0, kick them to the setup wizard
  if (!settings || settings.is_setup === 0) {
    redirect('/setup');
  }

  // 3. Otherwise, let them into the admin area
  return <>{children}</>;
}