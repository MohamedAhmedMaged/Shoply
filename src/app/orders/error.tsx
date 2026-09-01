"use client";

import RouteError from "@/components/RouteError";

export default function OrdersError({
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
      title="Failed to load orders"
      description="We couldn't load your orders. Please try again."
    />
  );
}
