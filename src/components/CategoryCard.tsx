import Link from "next/link";
import {
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Car,
  Baby,
  Sparkles,
  Tag,
} from "lucide-react";

const iconMap: Record<string, any> = {
  electronics: Laptop,
  fashion: Shirt,
  home: Home,
  sports: Dumbbell,
  books: BookOpen,
  automotive: Car,
  baby: Baby,
  accessories: Sparkles,
};

const colorMap: Record<string, string> = {
  electronics: "from-violet-500 to-purple-600",
  fashion: "from-pink-500 to-rose-600",
  home: "from-emerald-500 to-green-600",
  sports: "from-orange-500 to-amber-600",
  books: "from-blue-500 to-cyan-600",
  automotive: "from-slate-500 to-zinc-600",
  baby: "from-yellow-500 to-orange-600",
  accessories: "from-fuchsia-500 to-pink-600",
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default async function CategoryCard() {
  let categories: Category[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/categories`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) categories = json.data;
    }
  } catch {
    categories = [];
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            Browse our wide selection of categories
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat: any) => {
            const Icon = iconMap[cat.slug] || Tag;
            const color = colorMap[cat.slug] || "from-primary to-accent";
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
