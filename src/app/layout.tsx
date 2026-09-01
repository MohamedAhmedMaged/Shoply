import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";
import { APP_URL } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Shoply - Modern E-Commerce Platform",
    template: "%s | Shoply",
  },
  description: "Discover premium products with the best deals. Shop electronics, fashion, home essentials and more.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Shoply",
    title: "Shoply - Modern E-Commerce Platform",
    description: "Discover premium products with the best deals. Shop electronics, fashion, home essentials and more.",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoply - Modern E-Commerce Platform",
    description: "Discover premium products with the best deals. Shop electronics, fashion, home essentials and more.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
