"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchOrderById } from "@/lib/storage";
import { Order } from "@/types";
import {
  formatCurrency,
  formatCardMask,
  formatExpiryMask,
  detectCardBrand,
  sanitizeInput,
} from "@/lib/utils";
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
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);

  // Estados de Pagamento Alternativo com Cartão de Crédito
  const [paymentTab, setPaymentTab] = useState<"pix" | "card">("pix");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    installments: "1",
  });
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const confettiFired = useRef(false);

  const fireConfetti = () => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    try {
      confetti({
        particleCount: 90,
        spread: 80,
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
          } else if (
            found.paymentStatus === "pending" &&
            !found.paymentDetails?.pixQrCode
          ) {
            // Se o pedido está pendente mas não possui código PIX gerado (ex: pedido anterior), gera automaticamente
            try {
              const res = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: found, type: "pix" }),
              });
              if (res.ok) {
                const payData = await res.json();
                if (payData.paymentDetails) {
                  setOrder((prev) =>
                    prev ? { ...prev, paymentDetails: payData.paymentDetails } : null
                  );
                }
              }
            } catch (err) {
              console.warn("Aviso ao inicializar dados do PIX:", err);
            }
          }
        }
      }
    }
    loadOrder();
  }, [orderId]);

  // Polling automático para detecção de pagamento PIX em tempo real
  useEffect(() => {
    if (!order || order.paymentStatus === "paid") {
      return;
    }

    const interval = setInterval(async () => {
      try {
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
            setCheckFeedback({
              type: "success",
              text: "Pagamento confirmado automaticamente! Seu pedido entrou em produção.",
            });
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn("Erro no check de pagamento automático:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [order?.id, order?.paymentStatus]);

  const pixKey =
    order?.paymentDetails?.pixQrCode ||
    "00020126580014br.gov.bcb.pix0136snapcase-pix-key@pix.com.br5204000053039865802BR5925SNAPCASE STUDIO6009SAO PAULO62070503***6304E72B";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Verificação Manual Imediata
  const handleManualCheck = async () => {
    if (!order) return;
    setCheckingPayment(true);
    setCheckFeedback(null);

    try {
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
          setCheckFeedback({
            type: "success",
            text: "Pagamento identificado com sucesso! Sua capinha já está na esteira de produção.",
          });
          return;
        }
      }

      setCheckFeedback({
        type: "info",
        text: "O banco ainda não identificou o pagamento. Se você já realizou o PIX, aguarde alguns segundos e clique novamente.",
      });
    } catch (err) {
      setCheckFeedback({
        type: "error",
        text: "Erro ao consultar status no banco. Tente novamente em instantes.",
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  // Pagamento via Cartão de Crédito transparente
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCardError(null);

    const cleanCard = cardData.number.replace(/\D/g, "");
    if (cleanCard.length < 13) {
      setCardError("Por favor, digite um número de cartão válido.");
      return;
    }
    if (!cardData.name.trim()) {
      setCardError("Digite o nome impresso no cartão.");
      return;
    }
    if (cardData.expiry.replace(/\D/g, "").length < 4) {
      setCardError("Digite a validade do cartão (MM/AA).");
      return;
    }
    if (cardData.cvv.length < 3) {
      setCardError("Digite o código de segurança (CVV).");
      return;
    }

    setCardSubmitting(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order,
          type: "card",
          cardInput: {
            cardNumber: cardData.number,
            cardHolderName: cardData.name,
            expiry: cardData.expiry,
            cvv: cardData.cvv,
            installments: Number(cardData.installments) || 1,
          },
        }),
      });

      const payData = await res.json();
      if (!res.ok || payData.error || payData.status === "rejected") {
        setCardError(
          payData.error ||
            "Pagamento não autorizado pelo emissor do cartão. Verifique os dados digitados ou escolha pagar com PIX."
        );
        setCardSubmitting(false);
        return;
      }

      if (payData.status === "approved" || payData.success) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: "paid",
                status: "in_production",
                paymentMethod: "credit_card",
                paymentDetails: payData.paymentDetails,
              }
            : null
        );
        fireConfetti();
        setCheckFeedback({
          type: "success",
          text: "Pagamento com cartão aprovado instantaneamente! Pedido enviado para confecção.",
        });
      }
    } catch (err) {
      setCardError("Erro ao processar pagamento com cartão. Tente novamente.");
    } finally {
      setCardSubmitting(false);
    }
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
      {/* Botão de Retorno Rápido */}
      <div className="flex items-center justify-between">
        <Link
          href="/minha-conta"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Meus Pedidos</span>
        </Link>

        <span className="text-xs text-zinc-400 font-mono">
          ID: {order.orderNumber}
        </span>
      </div>

      {/* Top Banner de Status */}
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
            : `Conclua seu Pagamento, ${order.customer.name.split(" ")[0]}!`}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
          Pedido <strong className="text-zinc-950 font-bold">#{order.orderNumber}</strong>.{" "}
          {isPaid
            ? "Sua capinha personalizada já entrou na nossa esteira de impressão."
            : "Escolha pagar via PIX (com aprovação imediata) ou Cartão de Crédito para liberar a confecção imediata."}
        </p>
      </div>

      {/* Feedback de Verificação de Pagamento */}
      {checkFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
            checkFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : checkFeedback.type === "error"
              ? "bg-rose-50 border-rose-300 text-rose-900"
              : "bg-blue-50 border-blue-300 text-blue-900"
          }`}
        >
          {checkFeedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <span className="flex-1">{checkFeedback.text}</span>
          <button
            type="button"
            onClick={() => setCheckFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Seção Principal de Pagamento */}
      {!isPaid ? (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-[0_4px_25px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Header de Seleção de Método de Pagamento */}
          <div className="p-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-950 font-display flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-950" />
                Como deseja efetuar o pagamento?
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Total do Pedido:{" "}
                <strong className="text-base text-zinc-950 font-mono font-black">
                  {formatCurrency(order.totalAmount)}
                </strong>
              </p>
            </div>

            {/* Alternador de Método */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentTab("pix")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  paymentTab === "pix"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pagar com PIX</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                  Instantâneo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab("card")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  paymentTab === "card"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-zinc-950" />
                <span>Cartão de Crédito</span>
              </button>
            </div>
          </div>

          {/* Conteúdo Aba PIX */}
          {paymentTab === "pix" && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
                {/* QR Code */}
                <div className="p-4 bg-white rounded-2xl shadow-md border border-zinc-200 shrink-0 text-center relative group">
                  <img
                    src={qrImageSrc}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain mx-auto"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 mt-2 block uppercase tracking-wider">
                    Pagamento Instantâneo via PIX
                  </span>
                </div>

                {/* Instruções e Código Copia e Cola */}
                <div className="space-y-4 w-full max-w-md text-xs">
                  <div className="space-y-2 text-zinc-600 leading-relaxed">
                    <p className="font-bold text-zinc-950 text-sm">
                      Passo a passo para pagamento:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium">
                      <li>Abra o aplicativo do seu banco no celular.</li>
                      <li>Escolha a opção <strong>Pagar com PIX</strong>.</li>
                      <li>Escaneie o QR Code ao lado ou use o código Copia e Cola abaixo.</li>
                      <li>A confirmação é automática em poucos segundos!</li>
                    </ol>
                  </div>

                  {/* Código Copia e Cola */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 block">
                      Código PIX Copia e Cola
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                      <input
                        type="text"
                        readOnly
                        value={pixKey}
                        className="bg-transparent text-zinc-800 text-[11px] truncate flex-1 outline-none font-mono font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm active:scale-95"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Código</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Botões de Ação PIX */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleManualCheck}
                      disabled={checkingPayment}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {checkingPayment ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verificando no Banco...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Já Paguei! Verificar Pagamento</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo Aba Cartão de Crédito */}
          {paymentTab === "card" && (
            <form onSubmit={handleCardPayment} className="p-6 sm:p-8 space-y-4 max-w-xl mx-auto text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-zinc-950" />
                  <span className="font-bold text-zinc-900">
                    Dados do Cartão de Crédito
                  </span>
                </div>
                {cardData.number.replace(/\D/g, "").length >= 4 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      detectCardBrand(cardData.number).color
                    }`}
                  >
                    {detectCardBrand(cardData.number).name}
                  </span>
                )}
              </div>

              {cardError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0000 0000 0000 0000"
                  value={cardData.number}
                  onChange={(e) =>
                    setCardData({ ...cardData, number: formatCardMask(e.target.value) })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 font-mono transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nome Impresso no Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Como está gravado no cartão"
                  value={cardData.name}
                  onChange={(e) =>
                    setCardData({
                      ...cardData,
                      name: sanitizeInput(e.target.value).toUpperCase(),
                    })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all uppercase text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Validade (MM/AA) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    value={cardData.expiry}
                    onChange={(e) =>
                      setCardData({ ...cardData, expiry: formatExpiryMask(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 font-mono transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Código de Segurança (CVV) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 font-mono transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Parcelamento
                </label>
                <select
                  value={cardData.installments}
                  onChange={(e) =>
                    setCardData({ ...cardData, installments: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all text-xs"
                >
                  <option value="1">1x de {formatCurrency(order.totalAmount)} (Sem juros)</option>
                  <option value="2">2x de {formatCurrency(order.totalAmount / 2)} (Sem juros)</option>
                  <option value="3">3x de {formatCurrency(order.totalAmount / 3)} (Sem juros)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={cardSubmitting}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50 active:scale-95 mt-4"
              >
                {cardSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando Pagamento...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar {formatCurrency(order.totalAmount)} no Cartão</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Processamento 100% seguro com criptografia de ponta a ponta.</span>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Seção Quando o Pedido Já Está Pago */
        <div className="p-6 bg-emerald-50/60 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2.5 text-emerald-950 font-bold text-sm font-display">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Pagamento Confirmado com Sucesso</span>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> APROVADO
            </span>
          </div>

          <p className="text-xs text-emerald-800 leading-relaxed">
            Seu pagamento de <strong>{formatCurrency(order.totalAmount)}</strong> foi confirmado. 
            Sua capa personalizada já foi encaminhada para a fila de produção e impressão em alta resolução.
          </p>

          {order.paymentDetails?.ticketUrl && (
            <div className="pt-1">
              <a
                href={order.paymentDetails.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visualizar comprovante oficial</span>
              </a>
            </div>
          )}
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
              {isPaid ? "Fila de Impressão" : "Aguardando Pgto"}
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
            {(order.items || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <div className="w-12 h-16 bg-white p-1 rounded shrink-0 border border-zinc-200 flex items-center justify-center shadow-sm">
                  <img
                    src={item.previewMockupUrl || item.customization?.imageUrl}
                    alt={item.model?.name || "Capinha"}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-zinc-950 truncate font-display">
                    {item.model?.name}
                  </p>
                  <p className="text-zinc-500 text-[11px]">{item.finish?.name}</p>
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
          {order.shippingAddress && (
            <div className="text-zinc-700 space-y-1 leading-relaxed">
              <p className="font-bold text-zinc-950">{order.customer?.name}</p>
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
              {order.customer?.whatsapp && (
                <p className="pt-2 text-emerald-700 font-bold">
                  WhatsApp cadastrado: {order.customer.whatsapp}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/minha-conta"
          className="w-full sm:w-auto px-6 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition-all text-center shadow-md flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Acessar Meus Pedidos (Minha Conta)</span>
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs transition-all text-center"
        >
          Voltar para a Loja
        </Link>
      </div>
    </div>
  );
}
