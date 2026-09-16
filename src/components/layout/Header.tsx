"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, User, Truck, Search } from "lucide-react";
import Logo from "@/components/common/Logo";
import TrackOrderModal from "@/components/layout/TrackOrderModal";

export default function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const { isAdmin, handleUserIconClick } = useAuth();
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/90 bg-white/95 backdrop-blur-xl transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
        {/* Top Banner de Frete / Garantia */}
        <div className="bg-zinc-950 text-white text-[11px] font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <Truck className="w-3.5 h-3.5 text-zinc-300" />
          <span>Impressão UV Ultra-HD 9 Cores · Frete Grátis para todo o Brasil acima de R$ 149</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo SnapCase */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo variant="dark" size="md" showTagline={true} />
          </Link>

          {/* Links Centrais */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600">
            <Link href="/" className="text-zinc-950 hover:text-black transition-colors">
              Personalizar Capa
            </Link>
            <a href="#como-funciona" className="hover:text-zinc-950 transition-colors">
              Como Funciona
            </a>
            <a href="#materiais" className="hover:text-zinc-950 transition-colors">
              Nossos Materiais
            </a>
            <a href="#garantia" className="hover:text-zinc-950 transition-colors">
              Garantia de Qualidade
            </a>
          </nav>

          {/* Ações da Direita */}
          <div className="flex items-center gap-2">
            {/* Botão Rastrear Pedido (Disponível sem login) */}
            <button
              type="button"
              onClick={() => setIsTrackModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 shadow-sm"
              title="Rastrear ou consultar pedido"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Rastrear Pedido</span>
            </button>

            {/* Botão de Usuário / Login (Condicional Admin) */}
            <button
              type="button"
              onClick={handleUserIconClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isAdmin
                  ? "bg-zinc-950 border-zinc-950 text-white hover:bg-zinc-800 shadow-sm"
                  : "bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800"
              }`}
              title={isAdmin ? "Área do Lojista (Admin Conectado)" : "Login / Acesso"}
              aria-label={isAdmin ? "Área do Lojista" : "Login de Usuário"}
            >
              <User className="w-4 h-4" />
              {isAdmin ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-white">
                  Lojista
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              ) : (
                <span className="hidden sm:inline text-[11px] text-zinc-800 font-semibold">Entrar</span>
              )}
            </button>

            {/* Botão de Carrinho */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-zinc-950/10 hover:scale-105 active:scale-95"
              aria-label="Abrir Carrinho"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Carrinho</span>
              {totalItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-zinc-950 text-[11px] font-black flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Rastreamento Rápido de Pedido */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </>
  );
}
