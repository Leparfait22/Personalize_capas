"use client";

import React from "react";
import { CaseFinish } from "@/types";
import { CASE_FINISHES, CASE_COLORS } from "@/data/catalog";
import { ShieldCheck, Palette, Check, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MaterialSelectorProps {
  selectedFinish: CaseFinish;
  onSelectFinish: (finish: CaseFinish) => void;
  selectedColor: string;
  onSelectColor: (colorHex: string) => void;
}

export default function MaterialSelector({
  selectedFinish,
  onSelectFinish,
  selectedColor,
  onSelectColor,
}: MaterialSelectorProps) {
  return (
    <div className="space-y-6 bg-slate-900/40 p-5 sm:p-6 rounded-2xl border border-slate-800/80">
      {/* 1. Escolha do Acabamento / Material */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            3. Tipo e Acabamento da Capa
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CASE_FINISHES.map((finish) => {
            const isSelected = selectedFinish.id === finish.id;
            return (
              <button
                key={finish.id}
                type="button"
                onClick={() => onSelectFinish(finish)}
                className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-brand-500/15 border-brand-400 ring-1 ring-brand-400 shadow-md shadow-brand-500/10"
                    : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                {finish.badge && (
                  <span
                    className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      finish.popularBadge
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                    }`}
                  >
                    {finish.popularBadge && <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />}
                    {finish.badge}
                  </span>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-100 pr-16 leading-tight">
                    {finish.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {finish.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/50">
                  <span className="text-xs font-semibold text-slate-300">
                    {finish.priceAdd > 0 ? `+ ${formatCurrency(finish.priceAdd)}` : "Incluso no valor base"}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cor Base / Bordas */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-400" />
          4. Cor Base da Capinha
        </label>

        <div className="flex items-center gap-2.5 flex-wrap">
          {CASE_COLORS.map((color) => {
            const isSelected = selectedColor === color.hex;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onSelectColor(color.hex)}
                className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                  isSelected
                    ? "border-brand-400 scale-110 shadow-lg shadow-brand-500/30 ring-2 ring-brand-400/50"
                    : "border-slate-700 hover:border-slate-500 hover:scale-105"
                }`}
                style={{
                  backgroundColor: color.isTransparent ? "rgba(255, 255, 255, 0.2)" : color.hex,
                }}
                title={color.name}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 stroke-[3] ${
                      color.id === "white" || color.isTransparent ? "text-slate-900" : "text-white"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
