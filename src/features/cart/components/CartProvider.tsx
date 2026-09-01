"use client";

import { createContext, useContext, useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCartStore, type NormalizedCartItem } from "@/stores/cart.store";
import {
  getGuestCart,
  clearGuestCart,
} from "@/lib/guest-storage";

type CartContextValue = {
  items: NormalizedCartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isGuest: boolean;
  mergeComplete: boolean;
  addItem: (productId: string, quantity?: number, product?: any) => Promise<void>;
  removeItem: (itemId: string, productId?: string, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, productId?: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  syncGuestBadge: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const AUTH_pages = ["/login", "/register"];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user?.id;
  const store = useCartStore();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const hasMergedRef = useRef(false);
  const wasEverAuthenticatedRef = useRef(false);
  const [mergeComplete, setMergeComplete] = useState(false);

  // Initialize based on auth state
  useEffect(() => {
    if (status === "loading") return;

    // Never run merge on login/register pages. The merge can race with
    // window.location.href navigation: useSession() may flip to
    // "authenticated" on the login page before the hard-reload unmounts
    // this tree, causing localStorage to be cleared before the target
    // page's CartProvider has a chance to snapshot it.
    if (AUTH_pages.includes(pathname)) {
      // On auth pages, if the user somehow becomes authenticated, just
      // reset merge state so the target page will pick it up fresh.
      if (isAuthenticated) {
        hasMergedRef.current = false;
      }
      return;
    }

    if (isAuthenticated && session?.user?.id && !hasMergedRef.current) {
      hasMergedRef.current = true;
      wasEverAuthenticatedRef.current = true;
      setMergeComplete(false);

      const userId = session.user.id;

      const mergeAndLoad = async () => {
        // IMPORTANT: Read localStorage at merge time, not on mount.
        // This guarantees we always get the current guest data even if
        // the component remounted or re-rendered between mount and now.
        const guestCart = getGuestCart();

        // Show loading immediately during merge
        if (guestCart.length > 0) {
          store.setMergeLoading();
        }

        if (guestCart.length > 0) {
          // Add each guest cart item to the server cart in parallel.
          // Only clear localStorage if ALL requests succeed — otherwise
          // keep items for retry on next page load.
          const results = await Promise.allSettled(
            guestCart.map((item) =>
              fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: item.productId,
                  quantity: item.quantity,
                }),
              }).then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
            )
          );

          const allSucceeded = results.every((r) => r.status === "fulfilled");
          if (allSucceeded) {
            clearGuestCart();
          }
          // If any failed, localStorage is kept intact so items persist for retry.
        }

        // Now fetch the authenticated cart from the server
        await store.setAuthenticated(userId);

        // Mark merge as complete and invalidate checkout cart query
        setMergeComplete(true);
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      };
      mergeAndLoad();
    } else if (status === "unauthenticated") {
      // If the user was previously authenticated, their guest data was migrated
      // and cleared from localStorage. Do NOT restore stale guest data.
      const wasPreviouslyAuthenticated = wasEverAuthenticatedRef.current;

      hasMergedRef.current = false;
      setMergeComplete(false);
      // Clear authenticated state and React Query cache on logout
      store.resetStore();
      queryClient.removeQueries({ queryKey: ["cart"] });
      queryClient.removeQueries({ queryKey: ["wishlist-ids"] });
      queryClient.removeQueries({ queryKey: ["wishlist"] });
      queryClient.removeQueries({ queryKey: ["wishlist-count"] });

      if (!wasPreviouslyAuthenticated) {
        // User was a genuine guest who never authenticated — safe to show
        // any localStorage cart that was accumulated.
        // Use syncFromGuestStorage to fetch product details for all items
        // (setGuest only creates placeholders without fetching).
        store.syncFromGuestStorage();
      }
      // If wasPreviouslyAuthenticated, leave the cart empty. The guest
      // data was already migrated and cleared during the auth transition.
    }
  }, [isAuthenticated, status, session?.user?.id, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for localStorage changes (cross-tab)
  useEffect(() => {
    if (isAuthenticated) return;

    const handler = (e: StorageEvent) => {
      if (e.key === "guest_cart") {
        store.syncFromGuestStorage();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncGuestBadge = useCallback(() => {
    if (!isAuthenticated) {
      store.syncFromGuestStorage();
    }
  }, [isAuthenticated, store]);

  const value: CartContextValue = useMemo(
    () => ({
      items: store.items,
      itemCount: store.itemCount,
      total: store.total,
      isLoading: store.isLoading,
      isGuest: store.isGuest,
      mergeComplete,
      addItem: store.addItem,
      removeItem: store.removeItem,
      updateQuantity: store.updateQuantity,
      clearCart: store.clearAll,
      fetchCart: store.fetchCart,
      syncGuestBadge,
    }),
    [
      store.items,
      store.itemCount,
      store.total,
      store.isLoading,
      store.isGuest,
      mergeComplete,
      store.addItem,
      store.removeItem,
      store.updateQuantity,
      store.clearAll,
      store.fetchCart,
      syncGuestBadge,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
