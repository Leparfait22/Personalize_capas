"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/types";
import { getOrCreateCartSessionId } from "@/lib/session";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "createdAt" | "totalPrice">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  sessionId: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "personalize_cases_cart_items_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  // Inicializar ID de Sessão e carregar itens do Banco de Dados / localStorage
  useEffect(() => {
    const sid = getOrCreateCartSessionId();
    setSessionId(sid);

    async function loadCart() {
      try {
        // Tentar buscar do banco de dados via API
        const res = await fetch(`/api/cart?sessionId=${sid}`);
        if (res.ok) {
          const remoteItems: CartItem[] = await res.json();
          if (remoteItems && remoteItems.length > 0) {
            setItems(remoteItems);
            setIsLoaded(true);
            return;
          }
        }
      } catch (err) {
        console.warn("API de carrinho indisponível, usando fallback local:", err);
      }

      // Fallback local caso a API não retorne dados
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Erro ao carregar carrinho local:", e);
      } finally {
        setIsLoaded(true);
      }
    }

    loadCart();
  }, []);

  // Salvar backup leve no localStorage por segurança extra
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      try {
        const lightweightItems = items.map((item) => ({
          ...item,
          highResPrintUrl: item.previewMockupUrl || item.customization.imageUrl,
        }));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lightweightItems));
      } catch (err2) {
        console.error("Erro ao salvar backup no localStorage:", err2);
      }
    }
  }, [items, isLoaded]);

  const addItem = (itemData: Omit<CartItem, "id" | "createdAt" | "totalPrice">) => {
    const newItem: CartItem = {
      ...itemData,
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      totalPrice: itemData.unitPrice * itemData.quantity,
    };

    // Atualização instantânea na interface
    setItems((prev) => [newItem, ...prev]);
    setIsCartOpen(true);

    // Persistir em segundo plano no Banco de Dados (Supabase)
    const sid = sessionId || getOrCreateCartSessionId();
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, item: newItem }),
    }).catch((err) => console.error("Erro ao salvar item no banco:", err));
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    const sid = sessionId || getOrCreateCartSessionId();
    fetch(`/api/cart?sessionId=${sid}&itemId=${itemId}`, {
      method: "DELETE",
    }).catch((err) => console.error("Erro ao deletar item do banco:", err));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    let updatedItem: CartItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          updatedItem = {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
          return updatedItem;
        }
        return item;
      })
    );

    if (updatedItem) {
      const sid = sessionId || getOrCreateCartSessionId();
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, item: updatedItem }),
      }).catch((err) => console.error("Erro ao atualizar quantidade no banco:", err));
    }
  };

  const clearCart = () => {
    setItems([]);

    const sid = sessionId || getOrCreateCartSessionId();
    fetch(`/api/cart?sessionId=${sid}&clear=true`, {
      method: "DELETE",
    }).catch((err) => console.error("Erro ao limpar carrinho no banco:", err));
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCost = subtotal > 149 || subtotal === 0 ? 0 : 14.90;
  const total = subtotal + shippingCost;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
        shippingCost,
        total,
        sessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
