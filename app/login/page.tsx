import db from "@/lib/db";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const settings = db.prepare('SELECT is_setup, password_hash, company_name FROM settings WHERE id = 1').get() as any;
  
  if (!settings || settings.is_setup === 0) redirect('/setup');
  if (!settings.password_hash) redirect('/claim');

  return <LoginForm companyName={settings.company_name} />;
}