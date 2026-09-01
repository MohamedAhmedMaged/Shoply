'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: { name: string } | null;
  isActive: boolean;
  createdAt: string;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadProducts = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/products?page=${p}`);
      const result = await res.json();
      if (result.success) {
        setProducts(result.data.data);
        setTotalPages(result.data.pagination.totalPages);
        setPage(p);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(1); }, []);

  const toggleActive = async (productId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/products/create`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, isActive: !current }),
      });
      if (res.ok) {
        toast.success('Product updated');
        loadProducts(page);
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your product listings
          </p>
        </div>
        <Button asChild variant="default">
          <Link href="/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-foreground">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start selling by adding your first product
            </p>
            <Button asChild className="mt-4" variant="default">
              <Link href="/products/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stock</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {products.map((product) => (
                      <tr key={product._id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={product.images[0] || "/placeholder.svg"}
                                alt={product.name || "Product"}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <Link href={`/products/${product.slug}`} className="font-medium text-foreground hover:text-primary transition-colors">
                              {product.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {product.categoryId?.name || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{product.stock}</td>
                        <td className="px-4 py-3">
                          <Badge variant={product.isActive ? "success" : "secondary"}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/products/${product.slug}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(product._id, product.isActive)}
                            >
                              {product.isActive ? (
                                <ToggleRight className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadProducts(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
