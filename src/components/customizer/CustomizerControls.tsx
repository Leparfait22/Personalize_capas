"use client";

import React, { useRef, useState, useEffect } from "react";
import { CustomizationConfig, GalleryArtItem } from "@/types";
import { INITIAL_GALLERY_ARTS } from "@/data/catalog";
import { fetchGalleryItemsApi } from "@/lib/storage";
import { compressAndResizeImage } from "@/lib/utils";
import {
  Upload,
  RotateCw,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface CustomizerControlsProps {
  customization: CustomizationConfig;
  onChange: (config: Partial<CustomizationConfig>) => void;
}

export default function CustomizerControls({
  customization,
  onChange,
}: CustomizerControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [galleryArts, setGalleryArts] = useState<GalleryArtItem[]>(INITIAL_GALLERY_ARTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    fetchGalleryItemsApi().then((items) => {
      if (mounted && items && items.length > 0) {
        setGalleryArts(items);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const categories = Array.from(new Set(galleryArts.map((item) => item.category)));
  const filteredArts =
    selectedCategory === "all"
      ? galleryArts
      : galleryArts.filter((item) => item.category === selectedCategory);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await compressAndResizeImage(file);
      onChange({
        imageUrl: result.dataUrl,
        imageFileName: file.name,
        scale: 1,
        position: { x: 0, y: 0 },
        rotation: 0,
      });
    } catch (err) {
      console.warn("Erro ao comprimir imagem, tentando fallback:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            imageUrl: event.target.result as string,
            imageFileName: file.name,
            scale: 1,
            position: { x: 0, y: 0 },
            rotation: 0,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = () => {
    const newRotation = (customization.rotation + 90) % 360;
    onChange({ rotation: newRotation });
  };

  const handleRemoveImage = () => {
    onChange({
      imageUrl: null,
      imageFileName: undefined,
      imageDimensions: undefined,
      qualityRating: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5 bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      {/* 1. Upload de Imagem */}
      <div id="carregar-foto" className="scroll-mt-32">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
            <ImageIcon className="w-4 h-4 text-zinc-950" />
            1. Sua Foto ou Arte
          </span>
          {customization.imageUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover Foto
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="sr-only"
        />

        {!customization.imageUrl ? (
          <button
            type="button"
            onClick={handleOpenFilePicker}
            className="w-full flex flex-col items-center justify-center p-7 border-2 border-dashed border-zinc-300 hover:border-zinc-950 rounded-2xl bg-zinc-50/70 hover:bg-zinc-100/70 cursor-pointer transition-all duration-200 text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-white group-hover:scale-105 transition-transform mb-3 shadow-md shadow-zinc-950/10">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-950 mb-1 font-display">
              Carregar Minha Foto
            </span>
            <span className="text-xs text-zinc-500">
              Formatos aceitos: JPG, PNG ou WEBP (Alta Resolução)
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 gap-3">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-11 h-11 rounded-lg overflow-hidden border border-zinc-300 shrink-0 bg-white shadow-sm">
                <img
                  src={customization.imageUrl}
                  alt="Foto do cliente"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {customization.imageFileName || "Foto carregada com sucesso"}
                </p>
                {customization.imageDimensions && (
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {customization.imageDimensions.width} × {customization.imageDimensions.height} px
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenFilePicker}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-950 px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>Carregar Minha Foto</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Galeria de Artes Pré-Prontas da Loja */}
      {galleryArts.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 font-display">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              Ou escolha uma arte da nossa galeria:
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {filteredArts.length} {filteredArts.length === 1 ? "arte" : "artes"}
            </span>
          </div>

          {/* Filtro de Categorias da Galeria */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === "all"
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-950"
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid de Artes */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto pr-0.5">
            {filteredArts.map((art) => {
              const isSelected = customization.imageUrl === art.imageUrl;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      imageUrl: art.imageUrl,
                      imageFileName: `${art.name} (${art.category})`,
                      scale: 1,
                      position: { x: 0, y: 0 },
                      rotation: 0,
                    })
                  }
                  className={`group relative rounded-xl overflow-hidden border transition-all aspect-square shadow-sm hover:shadow-md focus:outline-none ${
                    isSelected
                      ? "border-zinc-950 ring-2 ring-zinc-950"
                      : "border-zinc-200 hover:border-zinc-950"
                  }`}
                  title={`${art.name} — ${art.category}`}
                >
                  <img
                    src={art.thumbUrl || art.imageUrl}
                    alt={art.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex flex-col justify-end p-1.5 text-left">
                    <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider leading-none truncate">
                      {art.category}
                    </span>
                    <span className="text-[10px] font-bold text-white leading-tight truncate mt-0.5">
                      {art.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Indicador de Qualidade da Imagem */}
      {customization.qualityRating && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${customization.qualityRating.score === "excellent" ||
              customization.qualityRating.score === "good"
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              : "bg-amber-50/80 border-amber-200 text-amber-950"
            }`}
        >
          {customization.qualityRating.score === "excellent" ||
            customization.qualityRating.score === "good" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          )}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold">
              <span>{customization.qualityRating.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-current font-mono">
                ~{customization.qualityRating.dpi} DPI
              </span>
            </div>
            <p className="opacity-90 leading-relaxed text-[11px]">
              {customization.qualityRating.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* 4. Controles de Edição (Rotação) */}
      {customization.imageUrl && (
        <div className="pt-2 border-t border-zinc-100 flex justify-center">
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold border border-zinc-200 transition-colors shadow-sm active:scale-95"
          >
            <RotateCw className="w-4 h-4 text-zinc-900" />
            Girar 90°
          </button>
        </div>
      )}
    </div>
  );
}
