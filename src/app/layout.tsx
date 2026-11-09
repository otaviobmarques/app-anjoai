import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SwRegister } from "@/components/SwRegister";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "500", "700", "800"] });

export const metadata: Metadata = {
  title: "Anjo IA",
  description: "Asas de luz para o seu dia a dia. Conselheiro cristão de bolso.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Anjo IA", statusBarStyle: "black-translucent" },
  icons: { apple: "/pwa-icon/apple-180" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const mode = c.get("cm")?.value ?? "auto";
  const fs = c.get("fs")?.value ?? "normal";
  return (
    <html lang="pt-BR" data-mode={mode} data-fs={fs} className={montserrat.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
