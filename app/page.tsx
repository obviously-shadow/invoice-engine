import { redirect } from "next/navigation";

export default function Home() {
  // We don't need a landing page. Send them straight into the software.
  redirect('/admin');
}