"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchOrderById } from "@/lib/storage";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Truck,
  Printer,
  Package,
  CreditCard,
  Wallet,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const confettiFired = useRef(false);

  const fireConfetti = () => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#009ee3", "#18181b", "#f59e0b"],
      });
    } catch (err) {
      console.warn("Confetti não inicializado:", err);
    }
  };

  useEffect(() => {
    async function loadOrder() {
      if (orderId) {
        const found = await fetchOrderById(orderId);
        if (found) {
          setOrder(found);
          if (found.paymentStatus === "paid") {
            fireConfetti();
          }
        }
      }
    }
    loadOrder();
  }, [orderId]);

  // Polling automático para detecção de pagamento PIX em tempo real
  useEffect(() => {
    if (!order || order.paymentStatus === "paid" || order.paymentMethod !== "pix") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setCheckingPayment(true);
        const res = await fetch(`/api/payment/check/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid || data.paymentStatus === "paid") {
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    paymentStatus: "paid",
                    status: "in_production",
                    paymentDetails: {
                      ...(prev.paymentDetails || {}),
                      ...(data.paymentDetails || {}),
                      mercadopagoStatus: "approved",
                    },
                  }
                : null
            );
            fireConfetti();
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn("Erro no check de pagamento:", err);
      } finally {
        setCheckingPayment(false);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [order?.id, order?.paymentStatus, order?.paymentMethod]);

  const pixKey =
    order?.paymentDetails?.pixQrCode ||
    "00020126580014br.gov.bcb.pix0136snapcase-pix-key@pix.com.br5204000053039865802BR5925SNAPCASE STUDIO6009SAO PAULO62070503***6304E72B";

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

  const isPaid = order.paymentStatus === "paid";
  const qrImageSrc = order.paymentDetails?.pixQrCodeBase64
    ? order.paymentDetails.pixQrCodeBase64.startsWith("data:")
      ? order.paymentDetails.pixQrCodeBase64
      : order.paymentDetails.pixQrCodeBase64.startsWith("PHN2") // SVG base64
      ? `data:image/svg+xml;base64,${order.paymentDetails.pixQrCodeBase64}`
      : `data:image/png;base64,${order.paymentDetails.pixQrCodeBase64}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        pixKey
      )}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Top Banner de Sucesso */}
      <div className="text-center space-y-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm border transition-all ${
            isPaid
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          }`}
        >
          {isPaid ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <QrCode className="w-8 h-8 animate-pulse" />
          )}
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {isPaid
            ? "Pagamento Confirmado!"
            : "Pedido Registrado · Aguardando Pagamento"}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 font-display">
          {isPaid
            ? `Tudo pronto, ${order.customer.name.split(" ")[0]}!`
            : `Falta pouco, ${order.customer.name.split(" ")[0]}!`}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
          Pedido <strong className="text-zinc-950 font-bold">#{order.orderNumber}</strong>.{" "}
          {isPaid
            ? "Sua capinha personalizada já entrou na nossa esteira de impressão."
            : "Conclua o pagamento via PIX para liberar a confecção imediata da sua capinha."}
        </p>
      </div>

      {/* Seção de Pagamento PIX Mercado Pago */}
      {order.paymentMethod === "pix" && (
        <div
          className={`p-6 bg-white rounded-2xl border shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-5 transition-all ${
            isPaid ? "border-emerald-200 bg-emerald-50/20" : "border-zinc-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-950 font-bold text-sm font-display">
              <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {isPaid
                  ? "PIX Confirmado com Sucesso"
                  : "Pague com PIX para liberar a produção imediata"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black text-emerald-700 font-mono">
                {formatCurrency(order.totalAmount)}
              </span>
              {isPaid ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> PAGO
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                  {checkingPayment && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  AGUARDANDO
                </span>
              )}
            </div>
          </div>

          {!isPaid ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
              {/* QR Code Oficial */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-zinc-200 shrink-0 text-center relative group">
                <img
                  src={qrImageSrc}
                  alt="QR Code PIX Asaas"
                  className="w-44 h-44 object-contain mx-auto"
                />
                <span className="text-[10px] font-semibold text-zinc-400 mt-1 block">
                  PIX Banco Central / Asaas
                </span>
              </div>

              <div className="space-y-3.5 w-full sm:max-w-md text-xs">
                <div className="space-y-1.5 text-zinc-600 leading-relaxed">
                  <p className="font-semibold text-zinc-900">Como pagar:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Abra o aplicativo do seu banco ou carteira digital.</li>
                    <li>Escolha a opção <strong>Pagar com PIX</strong>.</li>
                    <li>Escaneie o QR Code ao lado ou utilize o código Copia e Cola.</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 block">
                    Código PIX Copia e Cola
                  </label>
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
                      className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm active:scale-95"
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

                {order.paymentDetails?.ticketUrl && (
                  <div className="pt-1">
                    <a
                      href={order.paymentDetails.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visualizar comprovante oficial
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-medium">

              <span>
                <strong>Pagamento confirmado!</strong> Seu pedido foi enviado para o setor de produção.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Seção de Pagamento com Cartão (Crédito ou Débito) */}
      {(order.paymentMethod === "credit_card" || order.paymentMethod === "debit_card") && (
        <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-950 font-bold text-sm font-display">
              {order.paymentMethod === "debit_card" ? (
                <Wallet className="w-5 h-5 text-blue-600" />
              ) : (
                <CreditCard className="w-5 h-5 text-zinc-950" />
              )}
              <span>
                {order.paymentMethod === "debit_card"
                  ? "Pagamento via Cartão de Débito"
                  : "Pagamento via Cartão de Crédito"}
              </span>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> APROVADO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 text-[10px] block font-medium uppercase">Bandeira</span>
              <span className="font-bold text-zinc-950 font-display">
                {order.paymentDetails?.cardBrand || "Cartão"}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 text-[10px] block font-medium uppercase">Final do Cartão</span>
              <span className="font-mono font-bold text-zinc-950">
                •••• {order.paymentDetails?.cardLastFour || "••••"}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 text-[10px] block font-medium uppercase">Forma de Cobrança</span>
              <span className="font-bold text-zinc-950">
                {order.paymentMethod === "debit_card"
                  ? "À vista no Débito"
                  : `${order.paymentDetails?.installments || 1}x de ${formatCurrency(
                      order.paymentDetails?.installmentAmount || order.totalAmount
                    )}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Processado com autorização instantânea antifraude do Asaas.</span>
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
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                isPaid
                  ? "bg-zinc-950 text-white animate-pulse"
                  : "bg-amber-100 text-amber-700 border border-amber-300"
              }`}
            >
              {isPaid ? <Printer className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <span className="font-bold text-zinc-950 block text-[11px]">
              {isPaid ? "Fila de Impressão" : "Aguardando PIX"}
            </span>
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
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <div className="w-12 h-16 bg-white p-1 rounded shrink-0 border border-zinc-200 flex items-center justify-center shadow-sm">
                  <img
                    src={item.previewMockupUrl || item.customization.imageUrl}
                    alt={item.model.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-zinc-950 truncate font-display">
                    {item.model.name}
                  </p>
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
              {order.shippingAddress.complement
                ? `(${order.shippingAddress.complement})`
                : ""}
            </p>
            <p>
              {order.shippingAddress.neighborhood} · {order.shippingAddress.city} -{" "}
              {order.shippingAddress.state}
            </p>
            <p className="font-mono text-zinc-500 font-semibold">
              CEP: {order.shippingAddress.zipCode}
            </p>
            <p className="pt-2 text-emerald-700 font-bold">
              WhatsApp cadastrado: {order.customer.whatsapp}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-center pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto px-8 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition-all text-center shadow-lg shadow-zinc-950/10"
        >
          Voltar para a Loja
        </Link>
      </div>
    </div>
  );
}
