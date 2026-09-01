"use client";

import RouteError from "@/components/RouteError";

export default function CheckoutError({
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
      title="Checkout error"
      description="Something went wrong during checkout. Please try again."
    />
  );
}
