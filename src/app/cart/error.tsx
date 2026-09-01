"use client";

import RouteError from "@/components/RouteError";

export default function CartError({
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
      title="Failed to load cart"
      description="We couldn't load your cart. Please try again."
    />
  );
}
