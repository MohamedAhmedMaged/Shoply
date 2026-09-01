import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, CreditCard } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              <span className="text-foreground">Shop</span>
              <span className="text-accent">ly</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Discover premium products at amazing prices. Your trusted online shopping destination.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link href="#" aria-label="Facebook" className="rounded-md border border-border/50 p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="Instagram" className="rounded-md border border-border/50 p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                <Instagram className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="Twitter" className="rounded-md border border-border/50 p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="YouTube" className="rounded-md border border-border/50 p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                <Youtube className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Shop</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?deals=true&sortBy=discount&sortOrder=desc" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Best Deals
                </Link>
              </li>
              <li>
                <Link href="/register?role=SELLER" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Customer Service</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-accent">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Shoply. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">Secure payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
