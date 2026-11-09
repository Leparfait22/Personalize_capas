"use client";

import React, { useState } from "react";
import { Shield, Truck, Printer, Lock, Instagram, Mail, MessageCircle } from "lucide-react";
import Logo from "@/components/common/Logo";
import TrackOrderModal from "@/components/layout/TrackOrderModal";

export default function Footer() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        {/* Marca */}
        <div className="space-y-3 max-w-md">
          <Logo variant="dark" size="md" showTagline={true} />
          <p className="text-zinc-600 text-xs leading-relaxed pt-1">
            Seu estúdio especializado em capas de celular personalizadas com impressão fine-art sob medida.
          </p>
        </div>

        {/* Contato & Redes Sociais */}
        <div className="space-y-2.5">
          <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider font-display">
            Contato
          </h5>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://www.instagram.com/snapcasebrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                <Instagram className="w-4 h-4 text-zinc-900 shrink-0" />
                <span>@snapcasebrasil</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:Contato@studiot.rio"
                className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                <Mail className="w-4 h-4 text-zinc-900 shrink-0" />
                <span>Contato@studiot.rio</span>
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/5521994948282"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>(21) 99494-8282</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Rastrear Pedido */}
        <div className="md:self-center">
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
