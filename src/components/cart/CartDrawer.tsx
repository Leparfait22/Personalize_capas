"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  CheckCircle2,
} from "lucide-react";

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
    totalItems,
    subtotal,
    shippingCost,
    total,
  } = useCart();

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCartOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsCartOpen]);

  if (!isCartOpen) return null;

  // Barra de progresso para Frete Grátis (Meta R$ 149)
  const freeShippingThreshold = 149;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col animate-slide-up text-zinc-900">
          {/* Top Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-950 font-display">
                Seu Carrinho ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Frete Grátis */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-700 font-medium">
                <Truck className="w-4 h-4 text-zinc-900" />
                {remainingForFreeShipping === 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Frete Grátis Liberado
                  </span>
                ) : (
                  <>
                    Faltam <strong className="text-zinc-950">{formatCurrency(remainingForFreeShipping)}</strong> para Frete Grátis
                  </>
                )}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono font-bold">
                {Math.round(freeShippingProgress)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-950 transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-zinc-900 font-display">
                    Seu carrinho está vazio
                  </p>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Suba uma foto e monte a sua capinha personalizada com acabamento premium!
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Personalizar Agora
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex gap-3.5 relative group"
                >
                  {/* Thumbnail Mockup */}
                  <div className="w-16 h-24 bg-white rounded-lg overflow-hidden border border-zinc-200 shrink-0 flex items-center justify-center p-1 shadow-sm">
                    <img
                      src={item.previewMockupUrl || item.customization.imageUrl}
                      alt={item.model.name}
                      className="w-full h-full object-contain drop-shadow"
                    />
                  </div>

                  {/* Informações da Capa */}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-zinc-950 truncate font-display">
                          {item.model.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-zinc-400 hover:text-rose-600 p-0.5 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                        {item.finish.name}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-zinc-300"
                          style={{
                            backgroundColor:
                              item.caseColor === "transparent"
                                ? "#ffffff"
                                : item.caseColor,
                          }}
                        />
                        <span className="text-[10px] text-zinc-500">
                          {item.caseColor === "transparent" ? "Transparente" : "Base Colorida"}
                        </span>
                      </div>
                    </div>

                    {/* Quantidade e Preço */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-200 mt-2">
                      <div className="flex items-center border border-zinc-200 bg-white rounded-lg shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-zinc-600 hover:text-zinc-950"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-zinc-950 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-zinc-600 hover:text-zinc-950"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-zinc-950 font-mono">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer com Resumo e Botão de Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="text-zinc-950 font-bold font-mono">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Frete</span>
                  <span className="text-zinc-950 font-bold font-mono">
                    {shippingCost === 0 ? (
                      <strong className="text-emerald-700">GRÁTIS</strong>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                  <span>Total</span>
                  <span className="text-zinc-950 font-black font-mono text-base">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Avançar para o Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[11px] text-zinc-500 text-center">
                🔒 Pagamento 100% seguro via PIX ou Cartão
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
