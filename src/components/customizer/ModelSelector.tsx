"use client";

import React, { useState, useRef, useEffect } from "react";
import { PhoneModel, SmartphoneBrand } from "@/types";
import { Smartphone, ChevronDown, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ModelSelectorProps {
  models: PhoneModel[];
  selectedModel: PhoneModel;
  onSelectModel: (model: PhoneModel) => void;
}

export default function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lista de marcas presentes nos modelos
  const brands: SmartphoneBrand[] = Array.from(
    new Set(models.map((m) => m.brand))
  );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Fechar dropdown com a tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Filtragem dos modelos apenas por Marca
  const filteredModels = models.filter((model) => {
    return selectedBrandFilter === "all" || model.brand === selectedBrandFilter;
  });

  const handleSelect = (model: PhoneModel) => {
    onSelectModel(model);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="space-y-3 bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative"
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
          <Smartphone className="w-4 h-4 text-zinc-950" />
          2. Escolha o Modelo do Celular
        </label>
        <span className="text-xs font-black text-zinc-950 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
          {formatCurrency(selectedModel.basePrice)}
        </span>
      </div>

      {/* Botão de Acionamento Customizado e Estilizado */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between bg-zinc-50 hover:bg-zinc-100/80 border text-left rounded-xl px-4 py-3.5 transition-all shadow-sm outline-none ${
            isOpen
              ? "border-zinc-950 ring-2 ring-zinc-950/10 bg-white"
              : "border-zinc-200 hover:border-zinc-400"
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {selectedModel.brand}
              </span>
              <p className="text-sm font-bold text-zinc-950 truncate font-display">
                {selectedModel.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pl-2">
            <span className="text-xs font-bold text-zinc-900 font-mono">
              {formatCurrency(selectedModel.basePrice)}
            </span>
            <div
              className={`w-7 h-7 rounded-lg bg-zinc-200/80 flex items-center justify-center text-zinc-700 transition-transform duration-200 ${
                isOpen ? "rotate-180 bg-zinc-950 text-white" : ""
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Menu Dropdown Flutuante / Popover Estilizado */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-40 overflow-hidden animate-fade-in divide-y divide-zinc-100">
            {/* Filtros de Marca em Pílulas */}
            <div className="p-3 bg-zinc-50/80">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedBrandFilter("all")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                    selectedBrandFilter === "all"
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Todas ({models.length})
                </button>
                {brands.map((brand) => {
                  const count = models.filter((m) => m.brand === brand).length;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrandFilter(brand)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                        selectedBrandFilter === brand
                          ? "bg-zinc-950 text-white shadow-sm"
                          : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {brand} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista Scrollável de Modelos */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto p-1.5 space-y-1">
              {filteredModels.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  <p className="font-semibold text-zinc-700">Nenhum modelo nesta categoria</p>
                </div>
              ) : (
                filteredModels.map((model) => {
                  const isSelected = model.id === selectedModel.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelect(model)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-zinc-100/90 text-zinc-950 font-bold"
                          : "hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? "bg-zinc-950 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-zinc-950 truncate font-display block">
                            {model.name}
                          </span>
                          {model.tagline && (
                            <p className="text-[10px] text-zinc-500 truncate">
                              {model.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-zinc-950 shrink-0 pl-2">
                        {formatCurrency(model.basePrice)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detalhes sutis do modelo ativo */}
      <div className="flex items-center justify-between text-xs text-zinc-600 px-1 pt-0.5">
        <span>
          Modelo selecionado:{" "}
          <strong className="text-zinc-950 font-bold">{selectedModel.name}</strong>
        </span>
        <span className="text-zinc-500 font-mono text-[11px]">
          {selectedModel.dimensionsMm.width} × {selectedModel.dimensionsMm.height} mm
        </span>
      </div>
    </div>
  );
}
