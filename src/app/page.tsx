"use client";

import React, { useState, useEffect } from "react";
import PhoneMockupCanvas from "@/components/customizer/PhoneMockupCanvas";
import CustomizerControls from "@/components/customizer/CustomizerControls";
import ModelSelector from "@/components/customizer/ModelSelector";
import SpecsSummary from "@/components/customizer/SpecsSummary";
import { PhoneModel, CaseFinish, CustomizationConfig } from "@/types";
import { INITIAL_PHONE_MODELS, CASE_FINISHES } from "@/data/catalog";
import { fetchPhoneModelsApi } from "@/lib/storage";
import { useCart } from "@/context/CartContext";
import {
  ShieldCheck,
  Truck,
  HelpCircle,
  ChevronDown,
  Layers,
  Award,
  Smartphone,
} from "lucide-react";
import HeroBanner from "@/components/layout/HeroBanner";

export default function Home() {
  const { addItem } = useCart();

  // Modelos disponíveis (carregados dinamicamente do Supabase/localStorage)
  const [models, setModels] = useState<PhoneModel[]>(INITIAL_PHONE_MODELS);
  const [selectedModel, setSelectedModel] = useState<PhoneModel>(INITIAL_PHONE_MODELS[0]);
  const [selectedFinish, setSelectedFinish] = useState<CaseFinish>(CASE_FINISHES[0]);

  useEffect(() => {
    async function loadModels() {
      const fetched = await fetchPhoneModelsApi();
      if (fetched && fetched.length > 0) {
        setModels(fetched);
      }
    }
    loadModels();
  }, []);

  // Configuração da personalização
  const [customization, setCustomization] = useState<CustomizationConfig>({
    modelId: INITIAL_PHONE_MODELS[0].id,
    finishId: CASE_FINISHES[0].id,
    caseColor: "#111827",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&auto=format&fit=crop&q=85",
    imageFileName: "Golden Retriever (Exemplo)",
    scale: 1,
    position: { x: 0, y: 0 },
    rotation: 0,
  });

  // Função para exportar previews do Canvas
  const [exportFn, setExportFn] = useState<(() => { mockupUrl: string; highResUrl: string }) | null>(null);

  // FAQ Toggle
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCustomizationChange = (partial: Partial<CustomizationConfig>) => {
    setCustomization((prev) => ({ ...prev, ...partial }));
  };

  const handleSelectModel = (model: PhoneModel) => {
    setSelectedModel(model);
    setCustomization((prev) => ({ ...prev, modelId: model.id }));
  };

  const handleSelectPreset = (sampleUrl: string, sampleName?: string, modelId?: string) => {
    setCustomization((prev) => ({
      ...prev,
      imageUrl: sampleUrl,
      imageFileName: sampleName || "Exemplo Personalizado",
      scale: 1,
      position: { x: 0, y: 0 },
      rotation: 0,
      ...(modelId ? { modelId } : {}),
    }));

    if (modelId) {
      const found = models.find((m) => m.id === modelId);
      if (found) {
        setSelectedModel(found);
      }
    }
  };

  const handleAddToCart = () => {
    let previewMockup = "";
    let highResPrint = "";

    if (exportFn) {
      try {
        if (typeof exportFn === "function") {
          const exported = exportFn();
          previewMockup = exported.mockupUrl;
          highResPrint = exported.highResUrl;
        } else if (typeof exportFn === "object" && exportFn !== null) {
          previewMockup = (exportFn as any).mockupUrl || "";
          highResPrint = (exportFn as any).highResUrl || "";
        }
      } catch (e) {
        console.warn("Erro ao gerar preview exportado:", e);
      }
    }

    const unitPrice = selectedModel.basePrice;

    addItem({
      model: selectedModel,
      finish: selectedFinish,
      caseColor: customization.caseColor,
      customization: {
        imageUrl: customization.imageUrl || "",
        scale: customization.scale,
        position: customization.position,
        rotation: customization.rotation,
      },
      previewMockupUrl: previewMockup || customization.imageUrl || "",
      highResPrintUrl: highResPrint || customization.imageUrl || "",
      quantity: 1,
      unitPrice: unitPrice,
    });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* 1. Hero Banner Principal com CTA e Carrossel de Capinhas */}
      <HeroBanner
        onSelectPreset={handleSelectPreset}
        onStartCustomizing={() => {
          const el = document.getElementById("customizador");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* 2. Customizador Principal (Duas Colunas) */}
      <section id="customizador" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Mockup Canvas Interativo (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <PhoneMockupCanvas
              model={selectedModel}
              finish={selectedFinish}
              customization={customization}
              onCustomizationChange={handleCustomizationChange}
              onExportReady={(fn) => setExportFn(() => fn)}
            />
          </div>

          {/* Coluna Direita: Controles e Etapas de Configuração */}
          <div className="lg:col-span-7 space-y-6">
            {/* Etapa 1: Foto e Ajustes */}
            <CustomizerControls
              customization={customization}
              onChange={handleCustomizationChange}
            />

            {/* Etapa 2: Modelo do Smartphone */}
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
            />

            {/* Resumo de Especificações e Adicionar ao Carrinho */}
            <SpecsSummary
              model={selectedModel}
              finish={selectedFinish}
              customization={customization}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
      </section>

      {/* 3. Seção "Como Funciona" */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
            Processo Simples & Rápido
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1 font-display">
            Como Funciona Seu Pedido
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mt-2">
            Em menos de 3 minutos sua capinha personalizada é configurada e entra na nossa esteira de impressão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3 relative group hover:border-zinc-950 transition-colors">
            <span className="text-4xl font-black text-zinc-200 font-display block group-hover:text-zinc-950 transition-colors">
              01
            </span>
            <h3 className="text-base font-bold text-zinc-950 font-display">
              Escolha seu Modelo & Envie a Foto
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Faça upload de fotos de família, pets, viagens ou logos. Ajuste o posicionamento com feedback de nitidez em tempo real.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3 relative group hover:border-zinc-950 transition-colors">
            <span className="text-4xl font-black text-zinc-200 font-display block group-hover:text-zinc-950 transition-colors">
              02
            </span>
            <h3 className="text-base font-bold text-zinc-950 font-display">
              Impressão Fine Art UV Ultra-HD
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Nossa equipe processa seu arquivo em alta resolução e imprime diretamente na capinha com tintas flexíveis que não descascam.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3 relative group hover:border-zinc-950 transition-colors">
            <span className="text-4xl font-black text-zinc-200 font-display block group-hover:text-zinc-950 transition-colors">
              03
            </span>
            <h3 className="text-base font-bold text-zinc-950 font-display">
              Envio Rápido & Rastreamento
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Sua capa é higienizada, embalada com carinho e despachada para o seu endereço com código de rastreio direto no WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Seção "Nossos Materiais" */}
      <section id="materiais" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-zinc-950 text-white p-8 sm:p-12 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-white" />
              <span>Tecnologia de Proteção & Impressão</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-display leading-tight">
              Construídas para Proteger seu Celular de Verdade
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-4 leading-relaxed">
              Utilizamos polímeros premium com certificação contra quedas e agentes anti-amarelamento. Cada capa possui relevo especial ao redor da câmera e da tela para evitar contato direto com superfícies duras.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800">
              <div>
                <span className="text-2xl font-black text-white font-display">2.0m</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Teste de Queda</p>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-400 font-display">100%</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Sem Descascar</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white font-display">9 Cores</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Fidelidade UV</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white font-display">90 Dias</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Garantia Total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Seção de Perguntas Frequentes (FAQ) */}
      <section id="garantia" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
            Tire Suas Dúvidas
          </span>
          <h2 className="text-2xl font-black text-zinc-950 mt-1 font-display">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "A foto na capinha desbota ou descasca com o tempo?",
              a: "Não! A nossa impressão é realizada com tecnologia UV direta com secagem instantânea por luz ultravioleta, penetrando microscopicamente no substrato da capa. Oferecemos 90 dias de garantia contra qualquer defeito.",
            },
            {
              q: "Como sei se a minha foto vai ficar com boa qualidade?",
              a: "Nosso customizador conta com um indicador inteligente de resolução em tempo real. Se sua foto for muito pequena ou tiver baixa definição, o sistema alertará na tela com orientações.",
            },
            {
              q: "A capinha é compatível com carregamento por indução (Wireless / MagSafe)?",
              a: "Sim! Todas as nossas capas possuem espessura milimétrica calibrada para permitir o carregamento sem fio por indução sem necessidade de remover o smartphone.",
            },
            {
              q: "Qual é o prazo de confecção e entrega?",
              a: "A confecção é expressa: de 1 a 2 dias úteis para impressão e inspeção de qualidade. Após despachado, você recebe o código de rastreamento no WhatsApp para acompanhar a entrega.",
            },
          ].map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-sm transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-900 hover:text-black"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-zinc-950" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
