import type { Metadata, Viewport } from "next";
import "@fontsource-variable/montserrat";
import { cookies } from "next/headers";
import "./globals.css";
import { SwRegister } from "@/components/SwRegister";

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
    <html lang="pt-BR" data-mode={mode} data-fs={fs}>
      <body className="min-h-dvh antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
