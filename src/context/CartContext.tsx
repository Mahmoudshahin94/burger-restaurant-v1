"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/instant/client";
import type { MenuItem } from "@/types";

export interface LocalCartItem {
  id: string;
  product_id: string;
  size: "small" | "large" | null;
  quantity: number;
  product: MenuItem;
}

interface CartContextType {
  items: LocalCartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  loading: boolean;
  cartLoaded: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: MenuItem, size: "small" | "large" | null, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "judytech_cart";

function loadLocalCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: LocalCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize with localStorage data (synchronously for SSR safety)
  const [items, setItems] = useState<LocalCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Mark cart as loaded after mount
  useEffect(() => {
    // Re-sync from localStorage in case of hydration mismatch
    const stored = loadLocalCart();
    setItems(prev => {
      if (stored.length > 0 && prev.length === 0) {
        return stored;
      }
      return prev;
    });
    setCartLoaded(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    saveLocalCart(items);
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    if (!item.product) return sum;
    const price =
      item.size === "small"
        ? (item.product.price_small ?? 0)
        : (item.product.price_large ?? item.product.price_small ?? 0);
    return sum + price * item.quantity;
  }, 0);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (product: MenuItem, size: "small" | "large" | null, quantity = 1) => {
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.product_id === product.id && item.size === size
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
          };
          return updated;
        }
        const newItem: LocalCartItem = {
          id: `${product.id}-${size}-${Date.now()}`,
          product_id: product.id,
          size,
          quantity,
          product,
        };
        return [...prev, newItem];
      });
      setIsOpen(true);
    },
    []
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setIsOpen(false);
  }, []);

  // ── Server sync (InstantDB) ─────────────────────────────────────────────
  // Guest-cart localStorage logic above is unchanged. Below, `db.useAuth()`
  // replaces `supabase.auth.onAuthStateChange`, and `db.useQuery`/`db.transact`
  // replace the old Supabase `cart_items` reads/writes.
  const { user } = db.useAuth();

  const { data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );
  const profileId = profileData?.profiles?.[0]?.id;

  const { data: cartData, isLoading: cartQueryLoading } = db.useQuery(
    user ? { cartItems: { $: { where: { "$user.id": user.id } }, product: {} } } : null
  );

  const prevUserIdRef = useRef<string | null>(null);
  const syncedUserIdRef = useRef<string | null>(null);

  // Merges the server's cart (for the signed-in user) into the local cart,
  // taking the max quantity per product+size — same rule the old Supabase
  // merge used. Any local-only lines (or quantity bumps) are then persisted
  // back to InstantDB in a single atomic `transact` call.
  const mergeServerCart = useCallback(() => {
    const serverRows = (cartData?.cartItems ?? []).filter((row) => row.product != null);

    const serverKeyToId = new Map<string, string>();
    const serverKeyToQuantity = new Map<string, number>();
    const mergedMap = new Map<string, LocalCartItem>();

    serverRows.forEach((row) => {
      const key = `${row.product!.id}-${row.size ?? null}`;
      serverKeyToId.set(key, row.id);
      serverKeyToQuantity.set(key, row.quantity ?? 1);
      mergedMap.set(key, {
        id: row.id,
        product_id: row.product!.id,
        size: (row.size as "small" | "large" | null) ?? null,
        quantity: row.quantity ?? 1,
        product: row.product as unknown as MenuItem,
      });
    });

    const localItems = loadLocalCart();
    localItems.forEach((localItem) => {
      const key = `${localItem.product_id}-${localItem.size}`;
      const existing = mergedMap.get(key);
      if (existing) {
        mergedMap.set(key, { ...existing, quantity: Math.max(existing.quantity, localItem.quantity) });
      } else {
        mergedMap.set(key, localItem);
      }
    });

    const merged = Array.from(mergedMap.values());
    if (merged.length > 0) {
      setItems(merged);
    }

    if (user && profileId) {
      const txs = merged.flatMap((item) => {
        const key = `${item.product_id}-${item.size}`;
        const serverId = serverKeyToId.get(key);
        if (serverId) {
          // Only write back if the merge actually bumped the quantity —
          // skip no-op updates for rows that already match the server.
          if (serverKeyToQuantity.get(key) === item.quantity) return [];
          return [db.tx.cartItems[serverId].update({ quantity: item.quantity })];
        }
        return [
          db.tx.cartItems[id()]
            .update({
              size: item.size,
              quantity: item.quantity,
              created_at: new Date().toISOString(),
            })
            .link({ product: item.product_id, profile: profileId, $user: user.id }),
        ];
      });
      if (txs.length > 0) {
        db.transact(txs).catch((err) => console.warn("Cart persist failed:", err));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartData, user, profileId]);

  const syncWithServer = useCallback(async () => {
    if (!user || cartQueryLoading) return;
    mergeServerCart();
  }, [user, cartQueryLoading, mergeServerCart]);

  // Mirrors the old sign-in/sign-out auth listener: merge once per sign-in,
  // and clear the cart on sign-out (guards against a shared-device carryover).
  useEffect(() => {
    if (!user) {
      if (prevUserIdRef.current) {
        clearCart();
      }
      prevUserIdRef.current = null;
      syncedUserIdRef.current = null;
      return;
    }

    prevUserIdRef.current = user.id;

    if (cartQueryLoading) return;
    if (syncedUserIdRef.current === user.id) return;

    syncedUserIdRef.current = user.id;
    mergeServerCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cartQueryLoading]);

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      subtotal,
      isOpen,
      loading: !!user && cartQueryLoading,
      cartLoaded,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncWithServer,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
