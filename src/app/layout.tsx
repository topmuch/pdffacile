import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDFFacile — Tous les outils PDF gratuits en ligne",
  description:
    "Fusionnez, divisez, compressez, pivotez et convertissez vos PDF gratuitement. Traitement 100 % local : vos fichiers ne quittent jamais votre navigateur.",
  keywords: ["PDF", "fusionner PDF", "diviser PDF", "compresser PDF", "outil PDF", "convertir PDF", "images vers PDF"],
  authors: [{ name: "PDFFacile" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "PDFFacile — Tous les outils PDF gratuits en ligne",
    description:
      "Fusionnez, compressez et convertissez vos fichiers PDF, Word, Excel, PowerPoint et images. 100 % gratuit, sans inscription.",
    url: "https://pdffacile.app",
    siteName: "PDFFacile",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFFacile — Outils PDF 100 % gratuits",
    description:
      "Fusionnez, compressez, convertissez. Gratuit, sans inscription, 100 % privé.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
