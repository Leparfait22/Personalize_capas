"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Upload,
  Sparkles,
} from "lucide-react";

export interface ShowcaseSlide {
  id: string;
  imageUrl: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "pet-dog",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&auto=format&fit=crop&q=85",
  },
  {
    id: "family-love",
    imageUrl: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&auto=format&fit=crop&q=85",
  },
  {
    id: "pet-cat",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=85",
  },
  {
    id: "couple-moment",
    imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=85",
  },
  {
    id: "mother-baby",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=85",
  },
];

interface HeroBannerProps {
  onSelectPreset?: (sampleUrl: string, sampleName?: string, modelId?: string) => void;
  onStartCustomizing?: () => void;
}

export default function HeroBanner({
  onSelectPreset,
  onStartCustomizing,
}: HeroBannerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const currentSlide = SHOWCASE_SLIDES[currentSlideIndex];

  // Auto-play do carrossel com pausa no hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlideIndex((prev) =>
      prev === 0 ? SHOWCASE_SLIDES.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleApplySlide = (slide: ShowcaseSlide) => {
    if (onSelectPreset) {
      onSelectPreset(slide.imageUrl, "Exemplo Personalizado");
    }
    const customizerEl = document.getElementById("customizador");
    if (customizerEl) {
      customizerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCtaClick = () => {
    if (onStartCustomizing) {
      onStartCustomizing();
    }
    const customizerEl = document.getElementById("customizador");
    if (customizerEl) {
      customizerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const CtaButton = ({ className = "" }: { className?: string }) => (
    <button
      type="button"
      onClick={handleCtaClick}
      className={`group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm sm:text-base shadow-xl shadow-zinc-950/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${className}`}
    >
      <Upload className="w-4 h-4 text-white" />
      <span>Começar a Personalizar</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </button>
  );

  const SocialProof = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex -space-x-2 overflow-hidden">
        <img
          className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          alt="Cliente"
        />
        <img
          className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
          alt="Cliente"
        />
        <img
          className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
          alt="Cliente"
        />
      </div>
      <div className="text-xs text-zinc-600">
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="font-bold text-zinc-900 ml-1">4.9/5</span>
        </div>
        <span className="text-[11px] text-zinc-500">+12.000 capinhas personalizadas entregues</span>
      </div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      {/* Container Principal do Banner em Tema Claro com Alto Contraste */}
      <div
        className="relative rounded-3xl border border-zinc-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-6 sm:p-8 lg:p-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Efeitos de Iluminação Sutis de Fundo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-zinc-100 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-zinc-100 rounded-full blur-3xl pointer-events-none" />

        {/* Grid: 2 Colunas no Desktop / Empilhado no Mobile */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ========================================================= */}
          {/* 1. COLUNA CTA / TEXTOS */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              <span>Nova Coleção SnapCase · Impressão UV Fine Art</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight font-display leading-[1.12]">
              Sua Foto Favorita na{" "}
              <span className="relative inline-block text-zinc-950">
                Capinha Perfeita
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-zinc-200/80 -z-10 rounded-sm" />
              </span>
            </h1>

            {/* Descrição */}
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl font-normal">
              Crie em 3 minutos uma capinha exclusiva para seu Smartphone. Com prévia em tempo real antes de finalizar seu pedido.
            </p>

            {/* Destaques / Benefícios Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-zinc-700 font-semibold bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Não descasca</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-700 font-semibold bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>90 dias garantia</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-700 font-semibold bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Prévia 100% Real</span>
              </div>
            </div>

            {/* CTA Desktop (Aparece apenas em lg+) */}
            <div className="hidden lg:block pt-2">
              <CtaButton />
            </div>

            {/* Prova Social Desktop (Aparece apenas em lg+) */}
            <div className="hidden lg:block pt-4 border-t border-zinc-100">
              <SocialProof />
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. COLUNA DO CARROSSEL LIMPO COM CAPAS INCLINADAS */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 w-full flex flex-col items-center justify-center py-2">
            <div
              className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Linha com Botão Anterior + Mockup Inclinado + Botão Próximo */}
              <div className="flex items-center justify-center w-full gap-3 sm:gap-6 px-1">
                {/* Botão Anterior */}
                <button
                  type="button"
                  onClick={handlePrev}
                  className="z-10 p-2.5 sm:p-3 rounded-full bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black border border-zinc-200 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 shrink-0"
                  aria-label="Capinha anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Frame da Capinha Inclinada (3D Tilt Effect isolado no mockup) */}
                <div
                  className="relative cursor-pointer group transition-all duration-500 transform -rotate-3 sm:-rotate-6 hover:-rotate-1 hover:scale-105 my-2"
                  onClick={() => handleApplySlide(currentSlide)}
                  title="Clique para testar este exemplo no customizador"
                >
                  {/* Sombra 3D com Profundidade */}
                  <div className="absolute -bottom-6 inset-x-4 h-12 bg-zinc-950/20 rounded-full blur-xl transform translate-y-3 scale-95" />

                  {/* Corpo da Capinha */}
                  <div className="relative w-48 sm:w-56 md:w-60 h-[360px] sm:h-[410px] md:h-[440px] rounded-[36px] p-2.5 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-2 border-zinc-700 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] overflow-hidden">
                    {/* Interior da capa com imagem */}
                    <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-zinc-900">
                      <img
                        key={currentSlide.id}
                        src={currentSlide.imageUrl}
                        alt="Capinha Personalizada com Foto"
                        className="w-full h-full object-cover transition-all duration-500 animate-fade-in"
                      />

                      {/* Módulo de Câmera Realista no Topo Esquerdo */}
                      <div className="absolute top-2.5 left-2.5 w-14 h-14 rounded-2xl bg-zinc-950/90 border border-white/20 p-1.5 shadow-lg backdrop-blur-md flex flex-col justify-between pointer-events-none">
                        <div className="flex justify-between items-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          </div>
                          <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          </div>
                        </div>
                        <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        </div>
                      </div>

                      {/* Reflexo Glossy da Capinha */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Botão Próximo */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="z-10 p-2.5 sm:p-3 rounded-full bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black border border-zinc-200 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 shrink-0"
                  aria-label="Próxima capinha"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Indicadores de Paginação (Dots Minimalistas) */}
              <div className="flex items-center gap-2 mt-5">
                {SHOWCASE_SLIDES.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlideIndex
                        ? "w-7 bg-zinc-950"
                        : "w-2 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                    aria-label={`Ver capinha ${index + 1}`}
                  />
                ))}
              </div>

              {/* CTA Mobile: Embaixo do carrossel no mobile (Aparece apenas em < lg) */}
              <div className="w-full pt-6 lg:hidden flex flex-col items-center space-y-4">
                <CtaButton className="w-full" />
                <div className="pt-2 border-t border-zinc-100 w-full flex justify-center">
                  <SocialProof />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
