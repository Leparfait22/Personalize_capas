"use client";

import React, { useState } from "react";
import { Shield, Truck, Printer, Lock, ChevronDown } from "lucide-react";
import Logo from "@/components/common/Logo";
import TrackOrderModal from "@/components/layout/TrackOrderModal";

export default function Footer() {
  const [openModels, setOpenModels] = useState(false);
  const [openFinishes, setOpenFinishes] = useState(false);
  const [openTrackModal, setOpenTrackModal] = useState(false);

  return (
    <footer className="bg-white border-t border-zinc-200 text-zinc-600 text-xs">
      {/* 4 Pilares de Qualidade e Confiança */}
      <div className="border-b border-zinc-200 py-10 bg-zinc-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm font-display">Impressão UV Ultra-HD</h4>
              <p className="text-zinc-600 text-xs mt-1 leading-relaxed">
                Tecnologia japonesa de 9 cores com alta definição e fidelidade cromática fotográfica.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm font-display">Garantia de Qualidade</h4>
              <p className="text-zinc-600 text-xs mt-1 leading-relaxed">
                Garantia total contra descasques, desbotamento ou defeitos de fabricação na capinha.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm font-display">Envio para Todo o Brasil</h4>
              <p className="text-zinc-600 text-xs mt-1 leading-relaxed">
                Produção rápida em 1 a 2 dias úteis e código de rastreamento enviado via WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-sm font-display">Checkout 100% Seguro</h4>
              <p className="text-zinc-600 text-xs mt-1 leading-relaxed">
                Pagamentos criptografados via PIX instantâneo com aprovação na hora ou Cartão de Crédito.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Coluna 1: Marca */}
        <div className="space-y-3 md:col-span-1">
          <Logo variant="dark" size="md" showTagline={true} />
          <p className="text-zinc-600 text-xs leading-relaxed pt-1">
            Seu estúdio especializado em capas de celular personalizadas com impressão fine-art sob medida.
          </p>
        </div>

        {/* Coluna 2: Modelos Populares (Dropdown Sanfona no Mobile) */}
        <div className="border-b md:border-b-0 border-zinc-100 pb-4 md:pb-0">
          <button
            type="button"
            onClick={() => setOpenModels(!openModels)}
            className="w-full flex items-center justify-between md:cursor-default font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2 md:mb-3 font-display text-left"
          >
            <span>Modelos Populares</span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-200 md:hidden ${
                openModels ? "rotate-180" : ""
              }`}
            />
          </button>
          <ul
            className={`space-y-2 text-xs transition-all duration-200 ${
              openModels ? "block mt-2" : "hidden md:block"
            }`}
          >
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Capas iPhone 16 Pro Max</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Capas iPhone 15 e 15 Pro</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Capas Samsung Galaxy S24 Ultra</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Capas Galaxy A55 / A54 5G</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Capas Xiaomi Redmi Note 13</span></li>
          </ul>
        </div>

        {/* Coluna 3: Acabamentos (Dropdown Sanfona no Mobile) */}
        <div className="border-b md:border-b-0 border-zinc-100 pb-4 md:pb-0">
          <button
            type="button"
            onClick={() => setOpenFinishes(!openFinishes)}
            className="w-full flex items-center justify-between md:cursor-default font-bold text-zinc-950 text-xs uppercase tracking-wider mb-2 md:mb-3 font-display text-left"
          >
            <span>Nossos Acabamentos</span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-200 md:hidden ${
                openFinishes ? "rotate-180" : ""
              }`}
            />
          </button>
          <ul
            className={`space-y-2 text-xs transition-all duration-200 ${
              openFinishes ? "block mt-2" : "hidden md:block"
            }`}
          >
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Silicone Anti-Impacto com Airbags</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Aveludada Soft Touch Fosca</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Transparente Crystal TPU</span></li>
            <li><span className="text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors">Black Matte Slim Grip</span></li>
          </ul>
        </div>

        {/* Coluna 4: Atendimento & Segurança */}
        <div>
          <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider mb-3 font-display">
            Atendimento ao Cliente
          </h5>
          <p className="text-xs text-zinc-600 leading-relaxed mb-3">
            Segunda a Sexta, das 09h às 18h.<br />
            Suporte via WhatsApp para dúvidas e arte.
          </p>
          
          <button
            type="button"
            onClick={() => setOpenTrackModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Rastrear meu Pedido</span>
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-200 py-6 text-center text-[11px] text-zinc-500">
        © {new Date().getFullYear()} SnapCase Studio. Todos os direitos reservados.
      </div>

      <TrackOrderModal
        isOpen={openTrackModal}
        onClose={() => setOpenTrackModal(false)}
      />
    </footer>
  );
}
