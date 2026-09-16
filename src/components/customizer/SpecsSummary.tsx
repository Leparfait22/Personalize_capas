"use client";

import React, { useState } from "react";
import { PhoneModel, CaseFinish, CustomizationConfig } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Clock, Shield, Printer, Check, ArrowRight } from "lucide-react";

interface SpecsSummaryProps {
  model: PhoneModel;
  finish: CaseFinish;
  customization: CustomizationConfig;
  onAddToCart: () => void;
}

export default function SpecsSummary({
  model,
  finish,
  customization,
  onAddToCart,
}: SpecsSummaryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const unitPrice = model.basePrice;

  const handleAdd = () => {
    setIsAdding(true);
    onAddToCart();
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 space-y-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      {/* Título e Preço */}
      <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-zinc-500">
            Resumo da Sua Capa
          </span>
          <h3 className="text-lg font-black text-zinc-950 mt-0.5 font-display">
            {model.name}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Capinha Personalizada Anti-Impacto</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-zinc-500 block">Preço Final</span>
          <span className="text-2xl font-black text-zinc-950 font-display">
            {formatCurrency(unitPrice)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block">
            ou até 3x sem juros
          </span>
        </div>
      </div>

      {/* Especificações Técnicas */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
          <span className="text-[11px] text-zinc-500 block mb-0.5">
            Dimensões do Aparelho
          </span>
          <span className="font-bold text-zinc-900">
            {model.dimensionsMm.width} × {model.dimensionsMm.height} mm
          </span>
        </div>

        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
          <span className="text-[11px] text-zinc-500 block mb-0.5">
            Impressão
          </span>
          <span className="font-bold text-zinc-900 flex items-center gap-1">
            <Printer className="w-3.5 h-3.5 text-zinc-950" />
            UV Ultra-HD 9 Cores
          </span>
        </div>

        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
          <span className="text-[11px] text-zinc-500 block mb-0.5">
            Prazo de Produção
          </span>
          <span className="font-bold text-zinc-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-950" />
            1 a 2 dias úteis
          </span>
        </div>

        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
          <span className="text-[11px] text-zinc-500 block mb-0.5">
            Garantia
          </span>
          <span className="font-bold text-zinc-900 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Garantia contra descasques
          </span>
        </div>
      </div>

      {/* Botão de Adicionar ao Carrinho */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdding}
        className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-xl ${
          justAdded
            ? "bg-emerald-600 text-white shadow-emerald-600/30"
            : "bg-zinc-950 hover:bg-zinc-800 text-white shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        {justAdded ? (
          <>
            <Check className="w-5 h-5 stroke-[3]" />
            Adicionado ao Carrinho!
          </>
        ) : isAdding ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <ShoppingBag className="w-5 h-5" />
            Adicionar ao Carrinho
            <ArrowRight className="w-4 h-4 ml-auto" />
          </>
        )}
      </button>

      {/* Selo de Confiança */}
      <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1.5 pt-1">
        🔒 Compra Segura · Envio para todo o Brasil com Rastreamento
      </p>
    </div>
  );
}
