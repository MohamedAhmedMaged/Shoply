"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UnverifiedEmailBanner from "@/components/UnverifiedEmailBanner";
import { WishlistProvider } from "@/features/wishlist/hooks/useWishlist";
import { CartProvider } from "@/features/cart/components/CartProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <WishlistProvider>
              <div className="flex min-h-screen flex-col bg-background text-foreground">
                <UnverifiedEmailBanner />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster richColors position="top-center" />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
