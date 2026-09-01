import ProductCard from "@/features/products/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";
import CategoryCard from "@/components/CategoryCard";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import connectDB from "@/lib/db";
import { Product } from "@/models";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  category: { name: string } | null;
};

export default async function HomePage() {
  let featuredProducts: Product[] = [];
  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    featuredProducts = (products as any[]).map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice || null,
      images: p.images || [],
      stock: p.stock,
      category: p.categoryId
        ? { name: (p.categoryId as any).name || "" }
        : null,
    }));
  } catch {
    featuredProducts = [];
  }

  const flashProducts = featuredProducts
    .filter((product) => product.comparePrice != null && product.comparePrice > product.price)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <HeroSlider />
      </div>

      <CategoryCard />

      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Featured Products
            </h2>
            <p className="mt-1 text-muted-foreground">
              Discover our latest collection
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/products">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                category: product.category || { name: "" },
              }}
            />
          ))}
        </div>

        {featuredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No products available yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for amazing deals!
            </p>
          </div>
        )}
      </section>

      {flashProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-accent/10 p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Flash Sale
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Limited time offers - don't miss out!
                </p>
              </div>
              <Button asChild variant="accent">
                <Link href="/products?deals=true">Shop All Deals</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {flashProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    category: product.category || { name: "" },
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-accent/20 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Stay Updated
          </h2>
          <p className="mt-2 text-muted-foreground">
            Subscribe to our newsletter for the latest deals and new arrivals
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
