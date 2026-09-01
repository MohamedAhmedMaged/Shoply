const CART_KEY = "guest_cart";
const WISHLIST_KEY = "guest_wishlist";

export type GuestCartItem = {
  productId: string;
  quantity: number;
  variantId?: string;
  addedAt: string;
};

export type GuestWishlistItem = {
  productId: string;
  addedAt: string;
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or private browsing
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ── Cart ──────────────────────────────────────────────

export function getGuestCart(): GuestCartItem[] {
  return safeGet<GuestCartItem[]>(CART_KEY, []);
}

export function setGuestCart(items: GuestCartItem[]): void {
  safeSet(CART_KEY, items);
}

export function addToGuestCart(
  productId: string,
  quantity: number,
  variantId?: string,
  availableStock?: number,
): GuestCartItem[] {
  const cart = getGuestCart();
  const existing = cart.find(
    (i) => i.productId === productId && (i.variantId || "") === (variantId || ""),
  );
  if (existing) {
    const newQuantity = existing.quantity + quantity;
    if (availableStock !== undefined && newQuantity > availableStock) {
      // Cap at available stock instead of silently overflowing
      existing.quantity = availableStock;
    } else {
      existing.quantity = newQuantity;
    }
  } else {
    const finalQuantity =
      availableStock !== undefined && quantity > availableStock
        ? availableStock
        : quantity;
    cart.push({ productId, quantity: finalQuantity, variantId, addedAt: new Date().toISOString() });
  }
  setGuestCart(cart);
  return cart;
}

export function removeFromGuestCart(productId: string, variantId?: string): GuestCartItem[] {
  const cart = getGuestCart().filter(
    (i) => !(i.productId === productId && (i.variantId || "") === (variantId || "")),
  );
  setGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(
  productId: string,
  quantity: number,
  variantId?: string,
  availableStock?: number,
): GuestCartItem[] {
  const cart = getGuestCart();
  const item = cart.find(
    (i) => i.productId === productId && (i.variantId || "") === (variantId || ""),
  );
  if (item) {
    if (quantity <= 0) {
      return removeFromGuestCart(productId, variantId);
    }
    // Cap at available stock if provided
    item.quantity =
      availableStock !== undefined && quantity > availableStock
        ? availableStock
        : quantity;
  }
  setGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  safeRemove(CART_KEY);
}

export function getGuestCartItemCount(): number {
  return getGuestCart().reduce((sum, i) => sum + i.quantity, 0);
}

// ── Wishlist ──────────────────────────────────────────

export function getGuestWishlist(): GuestWishlistItem[] {
  return safeGet<GuestWishlistItem[]>(WISHLIST_KEY, []);
}

export function setGuestWishlist(items: GuestWishlistItem[]): void {
  safeSet(WISHLIST_KEY, items);
}

export function addToGuestWishlist(productId: string): GuestWishlistItem[] {
  const list = getGuestWishlist();
  if (!list.some((i) => i.productId === productId)) {
    list.push({ productId, addedAt: new Date().toISOString() });
    setGuestWishlist(list);
  }
  return list;
}

export function removeFromGuestWishlist(productId: string): GuestWishlistItem[] {
  const list = getGuestWishlist().filter((i) => i.productId !== productId);
  setGuestWishlist(list);
  return list;
}

export function toggleGuestWishlist(productId: string): {
  items: GuestWishlistItem[];
  wishlisted: boolean;
} {
  const list = getGuestWishlist();
  const idx = list.findIndex((i) => i.productId === productId);
  let wishlisted: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    wishlisted = false;
  } else {
    list.push({ productId, addedAt: new Date().toISOString() });
    wishlisted = true;
  }
  setGuestWishlist(list);
  return { items: list, wishlisted };
}

export function isProductInGuestWishlist(productId: string): boolean {
  return getGuestWishlist().some((i) => i.productId === productId);
}

export function getGuestWishlistProductIds(): string[] {
  return getGuestWishlist().map((i) => i.productId);
}

export function clearGuestWishlist(): void {
  safeRemove(WISHLIST_KEY);
}
