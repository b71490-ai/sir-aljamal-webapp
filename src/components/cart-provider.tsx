"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCallback } from "react";
import { getAdminProductById } from "@/lib/admin-storage";
import { useHydrated } from "@/lib/use-hydrated";

type CartItem = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "sir-aljamal-cart";

const CartContext = createContext<CartContextValue | null>(null);

function sanitizeItems(items: CartItem[]) {
  return items.filter(
    (item) => item.quantity > 0 && Boolean(getAdminProductById(item.productId)),
  );
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? sanitizeItems(parsed) : [];
    } catch {
      return [];
    }
  });
  const visibleItems = useMemo(() => (hydrated ? items : []), [hydrated, items]);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    if (!getAdminProductById(productId) || quantity <= 0) {
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (!existing) {
        return [...prev, { productId, quantity }];
      }
      return prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setItems((prev) =>
        prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => visibleItems.reduce((acc, item) => acc + item.quantity, 0),
    [visibleItems],
  );

  const subtotal = useMemo(
    () =>
      visibleItems.reduce((acc, item) => {
        const product = getAdminProductById(item.productId);
        if (!product) {
          return acc;
        }
        return acc + product.price * item.quantity;
      }, 0),
    [visibleItems],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: visibleItems,
      totalItems,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [addToCart, clearCart, removeFromCart, subtotal, totalItems, updateQuantity, visibleItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
