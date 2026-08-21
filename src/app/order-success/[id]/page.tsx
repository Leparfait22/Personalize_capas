"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSavedOrders } from "@/lib/storage";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Truck,
  ArrowRight,
  Printer,
  Package,
} from "lucide-react";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      const orders = getSavedOrders();
      const found = orders.find((o) => o.id === orderId);
      if (found) {
        setOrder(found);
      }
    }
  }, [orderId]);

  const pixKey = "00020126580014br.gov.bcb.pix0136snapcase-pix-key@pix.com.br5204000053039865802BR5925SNAPCASE STUDIO6009SAO PAULO62070503***6304E72B";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 text-xs">Carregando detalhes do seu pedido...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner de Sucesso */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Pedido Confirmado com Sucesso!
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 font-display">
          Obrigado, {order.customer.name.split(" ")[0]}!
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
          Seu pedido <strong className="text-zinc-950 font-bold">#{order.orderNumber}</strong> foi registrado. Em breve sua capinha exclusiva entrará em produção.
        </p>
      </div>

      {/* Seção de Pagamento PIX se aplicável */}
      {order.paymentMethod === "pix" && (
        <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-950 font-bold text-sm font-display">
              <QrCode className="w-5 h-5 text-emerald-600" />
              Pague com PIX para liberar a produção imediata
            </div>
            <span className="text-base font-black text-emerald-700 font-mono">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {/* Simulação QR Code */}
            <div className="p-3 bg-white rounded-xl shadow-md border border-zinc-200 shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  pixKey
                )}`}
                alt="QR Code PIX"
                className="w-36 h-36"
              />
            </div>

            <div className="space-y-3 w-full sm:max-w-sm text-xs">
              <p className="text-zinc-600">
                1. Abra o app do seu banco e escolha <strong>Pagar com PIX</strong>.<br />
                2. Escaneie o QR Code ao lado ou use o botão Copia e Cola abaixo.
              </p>

              <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                <input
                  type="text"
                  readOnly
                  value={pixKey}
                  className="bg-transparent text-zinc-700 text-[11px] truncate flex-1 outline-none font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Código
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linha do Tempo / Status do Pedido */}
      <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
        <h3 className="text-xs uppercase font-bold text-zinc-500 tracking-wider font-display">
          Status da Confecção
        </h3>

        <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="font-bold text-zinc-950 block text-[11px]">Pedido Recebido</span>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center mx-auto animate-pulse">
              <Printer className="w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-950 block text-[11px]">Fila de Impressão</span>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 border border-zinc-200 flex items-center justify-center mx-auto">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-zinc-400 block text-[11px]">Embalagem & QC</span>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 border border-zinc-200 flex items-center justify-center mx-auto">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-zinc-400 block text-[11px]">Em Transporte</span>
          </div>
        </div>
      </div>

      {/* Resumo dos Itens e Endereço */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Itens */}
        <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
          <h4 className="font-bold text-zinc-950 text-sm font-display">Capinhas do Pedido</h4>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="w-12 h-16 bg-white p-1 rounded shrink-0 border border-zinc-200 flex items-center justify-center shadow-sm">
                  <img
                    src={item.previewMockupUrl || item.customization.imageUrl}
                    alt={item.model.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-zinc-950 truncate font-display">{item.model.name}</p>
                  <p className="text-zinc-500 text-[11px]">{item.finish.name}</p>
                  <span className="text-zinc-500 text-[11px] block mt-0.5">
                    Qtd: {item.quantity} · {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Endereço de Entrega */}
        <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
          <h4 className="font-bold text-zinc-950 text-sm font-display">Endereço de Envio</h4>
          <div className="text-zinc-700 space-y-1 leading-relaxed">
            <p className="font-bold text-zinc-950">{order.customer.name}</p>
            <p>
              {order.shippingAddress.street}, {order.shippingAddress.number}{" "}
              {order.shippingAddress.complement ? `(${order.shippingAddress.complement})` : ""}
            </p>
            <p>
              {order.shippingAddress.neighborhood} · {order.shippingAddress.city} - {order.shippingAddress.state}
            </p>
            <p className="font-mono text-zinc-500 font-semibold">CEP: {order.shippingAddress.zipCode}</p>
            <p className="pt-2 text-emerald-700 font-bold">
              WhatsApp cadastrado: {order.customer.whatsapp}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 rounded-xl font-bold text-xs transition-colors text-center shadow-sm"
        >
          Voltar para a Loja
        </Link>
        <Link
          href="/admin"
          className="w-full sm:w-auto px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20"
        >
          <span>Ver no Painel do Lojista</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
