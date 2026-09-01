"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  toggleWishlist as toggleAction,
  addToWishlist as addAction,
  removeFromWishlist as removeAction,
} from "@/actions/wishlist.action";
import {
  getGuestWishlistProductIds,
  toggleGuestWishlist,
  addToGuestWishlist,
  removeFromGuestWishlist,
  clearGuestWishlist,
} from "@/lib/guest-storage";
import { toast } from "sonner";

export type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  category: { name: string } | null;
};

export type WishlistEntry = {
  id: string;
  productId: WishlistProduct | null;
  createdAt: string | null;
};

type WishlistContextValue = {
  isAuthenticated: boolean;
  ids: Set<string>;
  count: number;
  isLoadingIds: boolean;
  isProductWishlisted: (productId: string) => boolean;
  toggle: (productId: string, options?: { silent?: boolean }) => Promise<boolean | null>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearGuest: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const AUTH_pages = ["/login", "/register"];

async function fetchWishlistIds(): Promise<string[]> {
  const data = await apiFetch<{ ids: string[]; count: number }>(
    "/api/wishlist/ids",
  );
  return data.ids || [];
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated" && !!session?.user?.id;

  // Guest wishlist state (localStorage)
  const [guestIds, setGuestIds] = useState<string[]>([]);

  const hasMergedRef = useRef(false);
  const wasEverAuthenticatedRef = useRef(false);

  // Load guest wishlist when in guest mode.
  // Skip if user was previously authenticated — guest data was migrated & cleared.
  useEffect(() => {
    if (!isAuthenticated && status !== "loading" && !wasEverAuthenticatedRef.current) {
      const ids = getGuestWishlistProductIds();
      setGuestIds(ids);
    }
  }, [isAuthenticated, status]);

  // Auth wishlist (server)
  const { data: authIds = [], isLoading: isLoadingAuthIds } = useQuery({
    queryKey: ["wishlist-ids", session?.user?.id],
    queryFn: fetchWishlistIds,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["wishlist-ids"] });
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
  }, [queryClient]);

  // Merge guest wishlist into auth wishlist after login
  const mergeGuestMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const results = await Promise.allSettled(
        productIds.map((pid) => addAction(pid))
      );
      const failed = results.filter((r) => r.status === "rejected");
      // If any failed, throw so onSuccess does NOT fire and localStorage is preserved
      if (failed.length > 0) {
        throw new Error(`Failed to merge ${failed.length} wishlist item(s)`);
      }
    },
    onSuccess: () => {
      clearGuestWishlist();
      setGuestIds([]);
      invalidateAll();
    },
  });

  useEffect(() => {
    // Skip merge on auth pages — same race condition as CartProvider.
    if (AUTH_pages.includes(pathname)) {
      if (isAuthenticated) {
        hasMergedRef.current = false;
      }
      return;
    }

    if (isAuthenticated && !hasMergedRef.current) {
      // Read localStorage at merge time, not on mount.
      const idsForMerge = getGuestWishlistProductIds();

      hasMergedRef.current = true;
      wasEverAuthenticatedRef.current = true;

      if (idsForMerge.length > 0) {
        mergeGuestMutation.mutate(idsForMerge);
      }
    }
    if (!isAuthenticated) {
      hasMergedRef.current = false;
    }
  }, [isAuthenticated, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth mutations
  const toggleMutation = useMutation({
    mutationFn: (productId: string) => toggleAction(productId),
    onSuccess: (data, productId) => {
      queryClient.setQueryData<string[]>(
        ["wishlist-ids", session?.user?.id],
        (prev) => {
          const set = new Set(prev || []);
          if (data.wishlisted) set.add(productId);
          else set.delete(productId);
          return Array.from(set);
        },
      );
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update wishlist");
    },
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => addAction(productId),
    onSuccess: (_data, productId) => {
      queryClient.setQueryData<string[]>(
        ["wishlist-ids", session?.user?.id],
        (prev) => {
          const set = new Set(prev || []);
          set.add(productId);
          return Array.from(set);
        },
      );
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add to wishlist");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeAction(productId),
    onSuccess: (_data, productId) => {
      queryClient.setQueryData<string[]>(
        ["wishlist-ids", session?.user?.id],
        (prev) => {
          const set = new Set(prev || []);
          set.delete(productId);
          return Array.from(set);
        },
      );
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove from wishlist");
    },
  });

  // Active IDs based on auth state
  const activeIds = isAuthenticated ? authIds : guestIds;
  const idSet = useMemo(() => new Set(activeIds), [activeIds]);

  const isProductWishlisted = useCallback(
    (productId: string) => idSet.has(productId),
    [idSet],
  );

  const toggle = useCallback(
    async (productId: string, options?: { silent?: boolean }) => {
      if (isAuthenticated) {
        const result = await toggleMutation
          .mutateAsync(productId)
          .catch(() => null);
        if (!result) return null;
        if (!options?.silent) {
          toast.success(
            result.wishlisted ? "Added to wishlist" : "Removed from wishlist",
          );
        }
        return result.wishlisted;
      }

      // Guest: use localStorage
      const { items, wishlisted } = toggleGuestWishlist(productId);
      setGuestIds(items.map((i) => i.productId));
      if (!options?.silent) {
        toast.success(
          wishlisted ? "Added to wishlist" : "Removed from wishlist",
        );
      }
      return wishlisted;
    },
    [isAuthenticated, toggleMutation],
  );

  const add = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        if (idSet.has(productId)) {
          toast.info("Already in your wishlist");
          return;
        }
        await addMutation.mutateAsync(productId).then(() => {
          toast.success("Added to wishlist");
        });
        return;
      }

      // Guest
      if (idSet.has(productId)) {
        toast.info("Already in your wishlist");
        return;
      }
      const items = addToGuestWishlist(productId);
      setGuestIds(items.map((i) => i.productId));
      toast.success("Added to wishlist");
    },
    [isAuthenticated, idSet, addMutation],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        if (!idSet.has(productId)) return;
        await removeMutation.mutateAsync(productId).then(() => {
          toast.success("Removed from wishlist");
        });
        return;
      }

      // Guest
      if (!idSet.has(productId)) return;
      const items = removeFromGuestWishlist(productId);
      setGuestIds(items.map((i) => i.productId));
      toast.success("Removed from wishlist");
    },
    [isAuthenticated, idSet, removeMutation],
  );

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      await queryClient.invalidateQueries({ queryKey: ["wishlist-ids"] });
    } else {
      setGuestIds(getGuestWishlistProductIds());
    }
  }, [isAuthenticated, queryClient]);

  const clearGuest = useCallback(() => {
    clearGuestWishlist();
    setGuestIds([]);
  }, []);

  const isLoadingIds = isAuthenticated ? isLoadingAuthIds : false;

  const value: WishlistContextValue = {
    isAuthenticated,
    ids: idSet,
    count: idSet.size,
    isLoadingIds,
    isProductWishlisted,
    toggle,
    add,
    remove,
    refresh,
    clearGuest,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
