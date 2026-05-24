"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [loading, setLoading] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const mounted = useRef(true);

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

  // Sync local cart with Supabase when user logs in
  const syncWithServer = useCallback(async () => {
    if (!mounted.current) return;
    setLoading(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user || !mounted.current) {
        setLoading(false);
        return;
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const { data: serverItems } = await supabase
          .from("cart_items")
          .select("*, products(*)")
          .eq("user_id", user.id)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
        if (!mounted.current) return;

        const validServerItems = (serverItems ?? []).filter((si) => si.products != null);
        if (validServerItems.length > 0) {
          const serverCart: LocalCartItem[] = validServerItems.map((si) => ({
            id: si.id,
            product_id: si.product_id,
            size: si.size as "small" | "large" | null,
            quantity: si.quantity ?? 1,
            product: si.products as MenuItem,
          }));

          const mergedMap = new Map<string, LocalCartItem>();
          serverCart.forEach((item) => {
            mergedMap.set(`${item.product_id}-${item.size}`, item);
          });

          const localItems = loadLocalCart();
          localItems.forEach((localItem) => {
            const key = `${localItem.product_id}-${localItem.size}`;
            if (mergedMap.has(key)) {
              const existing = mergedMap.get(key)!;
              mergedMap.set(key, { ...existing, quantity: Math.max(existing.quantity, localItem.quantity) });
            } else {
              mergedMap.set(key, localItem);
            }
          });

          if (mounted.current) {
            setItems(Array.from(mergedMap.values()));
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn("Cart sync failed or timed out:", err);
      }
    } catch (err) {
      console.warn("Cart sync session check failed:", err);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Listen for auth changes to sync cart
  useEffect(() => {
    mounted.current = true;
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted.current) return;
      
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        syncWithServer();
      } else if (event === "SIGNED_OUT") {
        clearCart();
      }
    });
    
    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      subtotal,
      isOpen,
      loading,
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
