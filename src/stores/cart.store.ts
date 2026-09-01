import { create } from "zustand";
import {
  getGuestCart,
  addToGuestCart,
  removeFromGuestCart,
  updateGuestCartItem,
  clearGuestCart,
  type GuestCartItem,
} from "@/lib/guest-storage";

type AuthCartItem = {
  id: string;
  productId: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: string[];
    stock: number;
  } | null;
  quantity: number;
  variantId?: string | null;
};

type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
};

export type NormalizedCartItem = {
  id: string;
  productId: CartProduct | null;
  quantity: number;
  variantId?: string | null;
  source: "guest" | "auth";
};

type CartState = {
  items: NormalizedCartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isGuest: boolean;
  setMergeLoading: () => void;
  setAuthenticated: (userId: string) => Promise<void>;
  setGuest: () => void;
  resetStore: () => void;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, product?: CartProduct) => Promise<void>;
  removeItem: (itemId: string, productId?: string, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, productId?: string, variantId?: string) => Promise<void>;
  clearAll: () => Promise<void>;
  syncFromGuestStorage: () => void;
  _guestCartToItems: (cart: GuestCartItem[]) => NormalizedCartItem[];
  _productCache: Map<string, CartProduct>;
};

async function fetchProduct(productId: string): Promise<CartProduct | null> {
  try {
    const res = await fetch(`/api/products/${productId}`);
    const json = await res.json();
    if (json.success && json.data) {
      return {
        id: json.data.id || json.data._id,
        name: json.data.name,
        slug: json.data.slug,
        price: json.data.price,
        comparePrice: json.data.comparePrice || null,
        images: json.data.images || [],
        stock: json.data.stock,
      };
    }
  } catch {
    // product may be deleted
  }
  return null;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  total: 0,
  isLoading: false,
  isGuest: true,
  _productCache: new Map(),

  _guestCartToItems: (cart: GuestCartItem[]): NormalizedCartItem[] => {
    const cache = get()._productCache;
    return cart.map((item) => ({
      id: `guest_${item.productId}_${item.variantId || ""}`,
      productId: cache.get(item.productId) || {
        id: item.productId,
        name: "Loading...",
        slug: "",
        price: 0,
        comparePrice: null,
        images: [],
        stock: 0,
      },
      quantity: item.quantity,
      variantId: item.variantId,
      source: "guest" as const,
    }));
  },

  setMergeLoading: () => {
    set({ isLoading: true });
  },

  resetStore: () => {
    set({
      items: [],
      itemCount: 0,
      total: 0,
      isLoading: false,
      isGuest: true,
    });
    get()._productCache.clear();
  },

  setGuest: () => {
    const guestCart = getGuestCart();
    const items = get()._guestCartToItems(guestCart);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce(
      (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
      0,
    );
    set({ items, itemCount, total, isGuest: true });
  },

  setAuthenticated: async (_userId: string) => {
    set({ isLoading: true, isGuest: false });
    try {
      const res = await fetch("/api/cart");
      const json = await res.json();
      if (json.success && json.data) {
        const authItems = (json.data.items || []) as AuthCartItem[];
        const items: NormalizedCartItem[] = authItems
          .filter((item) => item.productId)
          .map((item) => ({
            id: item.id,
            productId: item.productId!,
            quantity: item.quantity,
            variantId: item.variantId,
            source: "auth" as const,
          }));
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        const total = items.reduce(
          (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
          0,
        );
        set({ items, itemCount, total, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchCart: async () => {
    const { isGuest } = get();
    if (isGuest) {
      get().syncFromGuestStorage();
      return;
    }
    set({ isLoading: true });
    try {
      const res = await fetch("/api/cart");
      const json = await res.json();
      if (json.success && json.data) {
        const authItems = (json.data.items || []) as AuthCartItem[];
        const items: NormalizedCartItem[] = authItems
          .filter((item) => item.productId)
          .map((item) => ({
            id: item.id,
            productId: item.productId!,
            quantity: item.quantity,
            variantId: item.variantId,
            source: "auth" as const,
          }));
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        const total = items.reduce(
          (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
          0,
        );
        set({ items, itemCount, total, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId: string, quantity = 1, product?: CartProduct) => {
    const { isGuest, items, _productCache } = get();

    if (isGuest) {
      // Determine available stock for validation
      const productData = product || _productCache.get(productId);
      let availableStock = productData?.stock;

      // Fetch product if we don't have stock info
      if (availableStock === undefined) {
        const fetched = await fetchProduct(productId);
        if (fetched) {
          availableStock = fetched.stock;
          if (!_productCache.has(productId)) {
            _productCache.set(productId, fetched);
          }
        }
      }

      // Validate stock before adding
      const existingItem = items.find((i) => i.productId?.id === productId);
      const currentQuantity = existingItem?.quantity || 0;
      const requestedTotal = currentQuantity + quantity;

      if (availableStock !== undefined && availableStock !== null && requestedTotal > availableStock) {
        throw new Error(
          `Cannot add ${quantity} more. Only ${availableStock - currentQuantity} unit${availableStock - currentQuantity === 1 ? "" : "s"} available.`,
        );
      }

      // Optimistic update
      const existing = items.find((i) => i.productId?.id === productId);
      const optimisticItems = existing
        ? items.map((i) =>
            i.productId?.id === productId ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [
            ...items,
            {
              id: `guest_${productId}`,
              productId: product || _productCache.get(productId) || {
                id: productId,
                name: "Loading...",
                slug: "",
                price: 0,
                comparePrice: null,
                images: [],
                stock: availableStock || 0,
              },
              quantity,
              source: "guest" as const,
            },
          ];
      const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
      const optimisticTotal = optimisticItems.reduce(
        (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
        0,
      );
      set({ items: optimisticItems, itemCount: optimisticCount, total: optimisticTotal });

      // Persist to localStorage
      addToGuestCart(productId, quantity);

      // Update product data in items if we fetched it
      if (!_productCache.has(productId)) {
        const fetched = await fetchProduct(productId);
        if (fetched) {
          _productCache.set(productId, fetched);
          set((state) => ({
            items: state.items.map((i) =>
              i.productId?.id === productId && i.productId.name === "Loading..."
                ? { ...i, productId: fetched }
                : i,
            ),
          }));
        }
      }
      return;
    }

    // Auth: optimistic update
    const existing = items.find((i) => i.productId?.id === productId);
    const prevItems = [...items];
    const optimisticItems = existing
      ? items.map((i) =>
          i.productId?.id === productId ? { ...i, quantity: i.quantity + quantity } : i,
        )
      : [
          ...items,
          {
            id: `temp_${productId}`,
            productId: product || {
              id: productId,
              name: "Loading...",
              slug: "",
              price: 0,
              comparePrice: null,
              images: [],
              stock: 0,
            },
            quantity,
            source: "auth" as const,
          },
        ];
    const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
    const optimisticTotal = optimisticItems.reduce(
      (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
      0,
    );
    set({ items: optimisticItems, itemCount: optimisticCount, total: optimisticTotal });

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch {
      // Rollback
      set({
        items: prevItems,
        itemCount: prevItems.reduce((sum, i) => sum + i.quantity, 0),
        total: prevItems.reduce(
          (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
          0,
        ),
      });
    }
  },

  removeItem: async (itemId: string, productId?: string, variantId?: string) => {
    const { isGuest, items } = get();
    const prevItems = [...items];

    if (isGuest) {
      const targetProductId = productId || itemId.replace("guest_", "").split("_")[0];
      const optimisticItems = items.filter((i) => i.productId?.id !== targetProductId);
      const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
      const optimisticTotal = optimisticItems.reduce(
        (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
        0,
      );
      set({ items: optimisticItems, itemCount: optimisticCount, total: optimisticTotal });
      removeFromGuestCart(targetProductId, variantId);
      return;
    }

    // Auth: optimistic
    const optimisticItems = items.filter((i) => i.id !== itemId);
    const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
    const optimisticTotal = optimisticItems.reduce(
      (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
      0,
    );
    set({ items: optimisticItems, itemCount: optimisticCount, total: optimisticTotal });

    try {
      const res = await fetch(`/api/cart?cartItemId=${itemId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch {
      set({
        items: prevItems,
        itemCount: prevItems.reduce((sum, i) => sum + i.quantity, 0),
        total: prevItems.reduce(
          (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
          0,
        ),
      });
    }
  },

  updateQuantity: async (itemId: string, quantity: number, productId?: string, variantId?: string) => {
    const { isGuest, items, _productCache } = get();
    const prevItems = [...items];

    if (quantity <= 0) {
      return get().removeItem(itemId, productId, variantId);
    }

    if (isGuest) {
      const targetProductId = productId || itemId.replace("guest_", "").split("_")[0];

      // Validate stock for guest
      const cartItem = items.find((i) => i.productId?.id === targetProductId);
      const productData = cartItem?.productId || _productCache.get(targetProductId);
      let availableStock = productData?.stock;

      if (availableStock === undefined || availableStock === null) {
        const fetched = await fetchProduct(targetProductId);
        if (fetched) {
          availableStock = fetched.stock;
          if (!_productCache.has(targetProductId)) {
            _productCache.set(targetProductId, fetched);
          }
        }
      }

      if (availableStock !== undefined && availableStock !== null && quantity > availableStock) {
        throw new Error(
          `Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available in stock.`,
        );
      }

      const optimisticItems = items.map((i) =>
        i.productId?.id === targetProductId ? { ...i, quantity } : i,
      );
      const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
      const optimisticTotal = optimisticItems.reduce(
        (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
        0,
      );
      set({ items: optimisticItems, itemCount: optimisticCount, total: optimisticTotal });
      updateGuestCartItem(targetProductId, quantity, variantId);
      return;
    }

    // Auth: optimistic
    const optimisticItems = items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i,
    );
    const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
    const optimisticTotal = optimisticItems.reduce(
      (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
      0,
    );
    set({ items: optimisticItems, itemCount: optimisticCount, total: optimisticTotal });

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId, quantity }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch {
      set({
        items: prevItems,
        itemCount: prevItems.reduce((sum, i) => sum + i.quantity, 0),
        total: prevItems.reduce(
          (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
          0,
        ),
      });
    }
  },

  clearAll: async () => {
    const { isGuest, items } = get();
    const prevItems = [...items];

    if (isGuest) {
      set({ items: [], itemCount: 0, total: 0 });
      clearGuestCart();
      return;
    }

    set({ items: [], itemCount: 0, total: 0 });
    try {
      // Delete each cart item individually
      for (const item of prevItems) {
        if (item.source === "auth") {
          await fetch(`/api/cart?cartItemId=${item.id}`, { method: "DELETE" });
        }
      }
    } catch {
      set({
        items: prevItems,
        itemCount: prevItems.reduce((sum, i) => sum + i.quantity, 0),
        total: prevItems.reduce(
          (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
          0,
        ),
      });
    }
  },

  syncFromGuestStorage: () => {
    const guestCart = getGuestCart();
    const cache = get()._productCache;

    // Identify items that need product data fetched
    const needFetch = guestCart.filter(
      (item) => !cache.has(item.productId),
    );

    if (needFetch.length === 0) {
      // All products already cached — build items directly
      const items = get()._guestCartToItems(guestCart);
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      const total = items.reduce(
        (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
        0,
      );
      set({ items, itemCount, total, isGuest: true });
      return;
    }

    // Fetch all missing products in parallel, then set state once
    Promise.all(
      needFetch.map((item) =>
        fetchProduct(item.productId).then((product) => {
          if (product) {
            cache.set(item.productId, product);
          }
          return { productId: item.productId, product };
        }),
      ),
    ).then((results) => {
      // Remove items whose products no longer exist
      for (const { productId, product } of results) {
        if (!product) {
          removeFromGuestCart(productId);
        }
      }

      // Re-read guest cart after any removals
      const updatedCart = getGuestCart();
      const items = get()._guestCartToItems(updatedCart);
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      const total = items.reduce(
        (sum, i) => sum + (i.productId?.price || 0) * i.quantity,
        0,
      );
      set({ items, itemCount, total, isGuest: true });
    });
  },
}));
