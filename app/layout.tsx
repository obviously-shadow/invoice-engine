import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Engine | Command Center",
  description: "Self-hosted invoice and estimation CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Enforce Geist sans-serif, antialiasing, and slightly tighter letter spacing globally */}
      <body className="min-h-full flex flex-col font-sans tracking-tight text-zinc-950 bg-zinc-950 selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}