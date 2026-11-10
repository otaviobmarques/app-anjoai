import type { Metadata, Viewport } from "next";
import "@fontsource-variable/montserrat";
import { cookies } from "next/headers";
import "./globals.css";
import { SwRegister } from "@/components/SwRegister";

const DESCRIPTION = "Conselheiro cristão de bolso. Converse com o Anjo por texto ou por voz, receba orações e apoio nos dias difíceis.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://app.anjoia.com.br"),
  title: { default: "Anjo IA — Asas de luz para o seu dia a dia", template: "%s · Anjo IA" },
  description: DESCRIPTION,
  applicationName: "Anjo IA",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Anjo IA", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Anjo IA",
    title: "Anjo IA — Asas de luz para o seu dia a dia",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Anjo IA — Asas de luz para o seu dia a dia" }],
  },
  twitter: { card: "summary_large_image", title: "Anjo IA — Asas de luz para o seu dia a dia", description: DESCRIPTION, images: ["/og.png"] },
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
