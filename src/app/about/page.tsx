import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Truck, Sparkles, Users } from "lucide-react";

export const metadata = {
  title: "About Us - Shoply",
  description: "Learn more about Shoply and our mission to deliver premium products at amazing prices.",
};

const values = [
  {
    icon: Shield,
    title: "Trust & Quality",
    description: "We partner with verified sellers and rigorously vet every product to ensure it meets our quality standards.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Get your orders delivered quickly with our network of reliable shipping partners worldwide.",
  },
  {
    icon: Sparkles,
    title: "Curated Selection",
    description: "Every product on Shoply is hand-picked to bring you the best in design, value, and innovation.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "We're building a global community of shoppers and sellers who care about great products and great service.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          About <span className="text-accent">Shoply</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We're on a mission to make premium products accessible to everyone, everywhere.
        </p>
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">Our Story</h2>
          <p className="mt-4 text-muted-foreground">
            Shoply was founded with a simple idea: shopping online should be easy, trustworthy, and enjoyable.
            We noticed that finding quality products at fair prices often meant wading through endless listings
            on cluttered marketplaces. So we built a platform that puts the best products front and center,
            backed by sellers we trust and a support team that genuinely cares.
          </p>
          <p className="mt-4 text-muted-foreground">
            Today, Shoply serves thousands of customers around the world, connecting them with a curated
            catalog of premium goods from independent sellers and established brands alike.
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
          <p className="mt-4 text-muted-foreground">
            To empower shoppers and sellers by building the most trusted, customer-focused e-commerce
            platform on the web. We believe great products deserve great presentation, fair pricing,
            and reliable delivery — and we work every day to deliver on that promise.
          </p>
          <p className="mt-4 text-muted-foreground">
            Whether you're buying your first product or your hundredth, we're here to make the experience
            smooth, secure, and satisfying.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">What We Stand For</h2>
          <p className="mt-2 text-muted-foreground">The principles that guide everything we do.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div key={value.title} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <value.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{value.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-accent/20 p-8 text-center md:p-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Ready to start shopping?</h2>
        <p className="mt-2 text-muted-foreground">Browse our latest collection and find your next favorite product.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="accent">
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
