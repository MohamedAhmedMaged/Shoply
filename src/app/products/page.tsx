"use client";

import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/features/products/components/ProductCard";
import { useState, Suspense } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import SearchSuggestions from "@/components/SearchSuggestions";
import { useSearchParams } from "next/navigation";

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

type Category = {
  id: string;
  name: string;
  slug: string;
};

async function fetchProducts(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return apiFetch<{ data: Product[]; pagination: { page: number; totalPages: number; total: number } }>(
    `/api/products?${search.toString()}`
  );
}

async function fetchCategories() {
  return apiFetch<Category[]>("/api/categories");
}

function ProductsContent() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");
  const [page, setPage] = useState(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
  const [showFilters, setShowFilters] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(searchParams.get("deals") === "true");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const minPriceNum = minPrice !== "" ? Number(minPrice) : undefined;
  const maxPriceNum = maxPrice !== "" ? Number(maxPrice) : undefined;
  const priceRangeInvalid =
    minPriceNum !== undefined &&
    maxPriceNum !== undefined &&
    !Number.isNaN(minPriceNum) &&
    !Number.isNaN(maxPriceNum) &&
    minPriceNum > maxPriceNum;

  const { data, isLoading } = useQuery({
    queryKey: ["products", { search, category, sortBy, sortOrder, page, dealsOnly, minPrice: minPriceNum, maxPrice: maxPriceNum }],
    queryFn: () =>
      fetchProducts({
        search: search || undefined,
        category: category || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 12,
        deals: dealsOnly ? true : undefined,
        minPrice: minPriceNum,
        maxPrice: maxPriceNum,
      }),
    enabled: !priceRangeInvalid,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  });

  const products = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 0, total: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {dealsOnly ? "Deals" : "Products"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {pagination.total} product{pagination.total !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchSuggestions
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-3 sm:flex`}>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="flex h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categoriesLoading ? (
                <option disabled>Loading...</option>
              ) : (
                categories?.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>

            <select
              value={dealsOnly ? "true" : "false"}
              onChange={(e) => {
                setDealsOnly(e.target.value === "true");
                setPage(1);
              }}
              className="flex h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="false">All Products</option>
              <option value="true">Deals only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value;
                setSortBy(value);
                if (value === "discount") {
                  setSortOrder("desc");
                } else if (value === "-price") {
                  setSortBy("price");
                  setSortOrder("desc");
                } else {
                  setSortOrder("asc");
                }
              }}
              className="flex h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="createdAt">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name A-Z</option>
              <option value="discount">Biggest Discount</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Price</span>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-24"
              />
              <span className="text-sm text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-24"
              />
            </div>
          </div>

          {priceRangeInvalid && (
            <p className="text-sm text-destructive">
              Min price cannot be greater than max price.
            </p>
          )}

          {category && (
            <Badge variant="default" className="w-fit">
              Category: {categories?.find((c) => c.slug === category)?.name || category}
              <button
                onClick={() => {
                  setCategory("");
                  setPage(1);
                }}
                className="ml-2 text-xs hover:underline"
              >
                ✕
              </button>
            </Badge>
          )}

          {dealsOnly && (
            <Badge variant="default" className="w-fit">
              Deals only
              <button
                onClick={() => {
                  setDealsOnly(false);
                  setPage(1);
                }}
                className="ml-2 text-xs hover:underline"
              >
                ✕
              </button>
            </Badge>
          )}

          {(minPrice !== "" || maxPrice !== "") && !priceRangeInvalid && (
            <Badge variant="default" className="w-fit">
              Price: {minPrice !== "" ? `$${minPrice}` : "$0"} – {maxPrice !== "" ? `$${maxPrice}` : "∞"}
              <button
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setPage(1);
                }}
                className="ml-2 text-xs hover:underline"
              >
                ✕
              </button>
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-24 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No products found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setCategory("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setMinPrice("");
              setMaxPrice("");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  category: product.category || { name: "" },
                }}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
