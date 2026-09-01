"use client";

import RouteError from "@/components/RouteError";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Failed to load products"
      description="We couldn't load the products. Please check your connection and try again."
    />
  );
}
