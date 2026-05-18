import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import db from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = db.prepare("SELECT company_name FROM settings WHERE id = 1").get() as any;
    const companyName = settings?.company_name || "Client Portal";
    
    // Safely extract your live deployment domain to create absolute image URL pathing
    const origin = process.env.APP_ORIGIN || "";
    const logoUrl = origin ? `${origin}/LOGO.png` : "/LOGO.png";

    return {
      title: `${companyName} | Command Center`,
      description: `Secure document and operations portal for ${companyName}.`,
      metadataBase: origin ? new URL(origin) : undefined,
      icons: {
        icon: logoUrl,
        shortcut: logoUrl,
        apple: logoUrl,
      },
      openGraph: {
        title: `${companyName} | Secure Portal`,
        description: `Access your secure documents and portal.`,
        siteName: companyName,
        images: [
          {
            url: logoUrl,
            width: 512,
            height: 512,
            alt: `${companyName} Brand Logo`,
          },
        ],
      },
    };
  } catch (error) {
    return {
      title: "Secure Client Portal",
      description: "Business operations and document engine.",
      icons: { icon: "/LOGO.png" },
    };
  }
}

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
      <body className="min-h-full flex flex-col font-sans tracking-tight text-zinc-950 bg-zinc-950 selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}