"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/features/products/services/product.service";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
}
