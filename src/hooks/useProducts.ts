"use client";

import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/features/products/services/product.service";

export function useProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params || {}),
  });
}
