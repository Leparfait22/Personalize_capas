"use client";

import React, { useRef } from "react";
import { CustomizationConfig } from "@/types";
import { compressAndResizeImage } from "@/lib/utils";
import {
  Upload,
  RotateCw,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface CustomizerControlsProps {
  customization: CustomizationConfig;
  onChange: (config: Partial<CustomizationConfig>) => void;
}

// Exemplos de fotos de alta resolução para teste rápido
const SAMPLE_PHOTOS = [
  {
    name: "Golden Retriever",
    url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&auto=format&fit=crop&q=85",
    thumb: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "Família Feliz",
    url: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&auto=format&fit=crop&q=85",
    thumb: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "Gatinho Fofo",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=85",
    thumb: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "Casal Especial",
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=85",
    thumb: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=120&auto=format&fit=crop&q=80",
  },
];

export default function CustomizerControls({
  customization,
  onChange,
}: CustomizerControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      <div>
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

      {/* 2. Fotos de Demonstração / Presets Rápidos */}
      <div>
        <span className="text-xs font-semibold text-zinc-600 block mb-2">
          Ou teste agora com uma foto de exemplo:
        </span>
        <div className="grid grid-cols-4 gap-2.5">
          {SAMPLE_PHOTOS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                onChange({
                  imageUrl: sample.url,
                  imageFileName: sample.name,
                  scale: 1,
                  position: { x: 0, y: 0 },
                  rotation: 0,
                })
              }
              className="group relative rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all aspect-square shadow-sm hover:shadow-md"
            >
              <img
                src={sample.thumb}
                alt={sample.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[10px] font-semibold text-white leading-tight truncate">
                  {sample.name.split(" ")[0]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

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
