"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/features/wishlist/hooks/useWishlist";

type Variant = "icon" | "icon-overlay" | "full";

interface WishlistButtonProps {
  productId: string;
  variant?: Variant;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  stopPropagation?: boolean;
}

export default function WishlistButton({
  productId,
  variant = "icon",
  className,
  showLabel = false,
  size = "md",
  stopPropagation = true,
}: WishlistButtonProps) {
  const { isProductWishlisted, toggle, isLoadingIds } =
    useWishlist();
  const wishlisted = isProductWishlisted(productId);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size];

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    await toggle(productId);
  };

  if (variant === "icon-overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoadingIds}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/90 backdrop-blur transition-all hover:scale-105 hover:bg-background",
          sizeClasses,
          wishlisted && "border-rose-500/60 bg-rose-500/10",
          className,
        )}
      >
        <Heart
          className={cn(
            iconSizes,
            "transition-colors",
            wishlisted
              ? "fill-rose-500 text-rose-500"
              : "text-muted-foreground hover:text-rose-500",
          )}
        />
      </button>
    );
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoadingIds}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
          wishlisted
            ? "border-rose-500/60 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            : "border-input bg-background text-foreground hover:bg-muted",
          className,
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4",
            wishlisted ? "fill-rose-500 text-rose-500" : "text-rose-500",
          )}
        />
        {showLabel && (
          <span>
            {wishlisted ? "In Wishlist" : "Add to Wishlist"}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoadingIds}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg transition-colors",
        sizeClasses,
        wishlisted
          ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
          : "border border-input bg-background text-rose-500 hover:bg-rose-500/10",
        className,
      )}
    >
      <Heart
        className={cn(iconSizes, wishlisted && "fill-rose-500")}
      />
    </button>
  );
}
