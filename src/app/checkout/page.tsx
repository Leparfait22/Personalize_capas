"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  formatCurrency,
  sanitizeInput,
  formatCPFMask,
  formatPhoneMask,
  formatCEPMask,
  formatCardMask,
  formatExpiryMask,
  isValidCPF,
  isValidWhatsApp,
  isValidEmail,
  detectCardBrand,
} from "@/lib/utils";
import { saveNewOrderApi } from "@/lib/storage";
import { Order, ShippingOption, PaymentMethod } from "@/types";
import {
  Lock,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Truck,
  Clock,
  Sparkles,
  Wallet,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingCost: defaultShippingCost, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Melhor Envio Shipping States
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    cpf: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    installments: "1",
  });

  // Cotação de frete via API do Melhor Envio
  const fetchShipping = async (targetCep: string) => {
    const clean = targetCep.replace(/\D/g, "");
    if (clean.length !== 8) return;

    setShippingLoading(true);
    setShippingError(null);

    try {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toCep: clean,
          itemsCount: totalQuantity,
          subtotal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.options && data.options.length > 0) {
        setShippingOptions(data.options);
        // Pré-seleciona a opção recomendada (mais econômica / grátis)
        setSelectedShipping((prev) => {
          if (prev && data.options.some((o: ShippingOption) => o.id === prev.id)) {
            return data.options.find((o: ShippingOption) => o.id === prev.id) || data.options[0];
          }
          return data.options[0];
        });
      } else {
        setShippingError(data.error || "Não foi possível cotar frete para este CEP.");
      }
    } catch (err) {
      console.error("Erro ao calcular frete:", err);
      setShippingError("Erro de conexão ao cotar frete. Tente novamente.");
    } finally {
      setShippingLoading(false);
    }
  };

  // Busca CEP automático via ViaCEP e dispara cotação no Melhor Envio
  const handleCepBlur = async () => {
    const cleanCep = formData.zipCode.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setCepLoading(true);
      // Disparar cálculo de frete em paralelo
      fetchShipping(cleanCep);

      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            street: sanitizeInput(data.logradouro || ""),
            neighborhood: sanitizeInput(data.bairro || ""),
            city: sanitizeInput(data.localidade || ""),
            state: sanitizeInput(data.uf || "").toUpperCase(),
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) return;

    // 🔒 Validações de Segurança e Formato de Entrada
    const cleanCPF = formData.cpf.replace(/\D/g, "");
    const cleanWhatsApp = formData.whatsapp.replace(/\D/g, "");

    if (!isValidCPF(cleanCPF)) {
      setErrorMessage("Por favor, informe um número de CPF válido (com 11 dígitos corretos).");
      return;
    }

    if (!isValidWhatsApp(cleanWhatsApp)) {
      setErrorMessage("Por favor, informe um WhatsApp válido com DDD (Ex: 11 99999-9999).");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setErrorMessage("Por favor, informe um e-mail válido.");
      return;
    }

    // 🔒 Validação de Cartão de Crédito e Débito
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const cleanCard = cardData.number.replace(/\D/g, "");
      if (cleanCard.length < 13 || cleanCard.length > 19) {
        setErrorMessage("Por favor, informe um número de cartão válido com 15 ou 16 dígitos.");
        return;
      }

      if (!cardData.name.trim()) {
        setErrorMessage("Por favor, informe o nome impresso no cartão.");
        return;
      }

      const [expMonth, expYear] = cardData.expiry.split("/");
      const monthNum = parseInt(expMonth, 10);
      const yearNum = parseInt(expYear, 10);
      if (!monthNum || monthNum < 1 || monthNum > 12 || !yearNum) {
        setErrorMessage("Por favor, informe uma data de validade válida no formato MM/AA.");
        return;
      }

      if (cardData.cvv.replace(/\D/g, "").length < 3) {
        setErrorMessage("Por favor, informe o código de segurança (CVV) do cartão com 3 ou 4 dígitos.");
        return;
      }
    }

    setLoading(true);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `SC-${randomNum}`;

    const activeShippingCost = selectedShipping !== null
      ? selectedShipping.finalPrice
      : (subtotal >= 149 || subtotal === 0 ? 0 : defaultShippingCost);

    const discountAmount = paymentMethod === "pix" ? subtotal * 0.05 : 0;
    const finalTotal = Math.max(0, subtotal + activeShippingCost - discountAmount);

    // 🛡️ Sanitização Anti-XSS rigorosa para todos os campos gravados no banco
    const newOrder: Order = {
      id: orderId,
      orderNumber: orderNumber,
      customer: {
        name: sanitizeInput(formData.name).trim(),
        email: sanitizeInput(formData.email.toLowerCase()).trim(),
        whatsapp: formatPhoneMask(formData.whatsapp),
        cpf: formatCPFMask(formData.cpf),
      },
      shippingAddress: {
        zipCode: formatCEPMask(formData.zipCode),
        street: sanitizeInput(formData.street).trim(),
        number: sanitizeInput(formData.number).trim(),
        complement: sanitizeInput(formData.complement).trim(),
        neighborhood: sanitizeInput(formData.neighborhood).trim(),
        city: sanitizeInput(formData.city).trim(),
        state: sanitizeInput(formData.state.toUpperCase()).trim(),
      },
      items: [...items],
      subtotal,
      shippingCost: activeShippingCost,
      shippingMethod: selectedShipping
        ? {
            id: selectedShipping.id,
            name: selectedShipping.name,
            company: selectedShipping.company.name,
            price: selectedShipping.finalPrice,
            deliveryTime: selectedShipping.deliveryTime,
          }
        : undefined,
      discount: discountAmount,
      totalAmount: finalTotal,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Processar Pagamento via API do Asaas
      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: newOrder,
          cardInput:
            paymentMethod !== "pix"
              ? {
                  cardNumber: cardData.number,
                  cardHolderName: cardData.name,
                  expiry: cardData.expiry,
                  cvv: cardData.cvv,
                  installments: Number(cardData.installments) || 1,
                  isDebit: paymentMethod === "debit_card",
                }
              : undefined,
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok || payData.error || payData.status === "rejected") {
        setErrorMessage(
          payData.error ||
            "Pagamento não autorizado pelo emissor do cartão. Verifique os dados digitados ou escolha pagar via PIX."
        );
        setLoading(false);
        return;
      }

      // Anexar detalhes do pagamento (QR Code, ID MP, parcelamento)
      if (payData.paymentDetails) {
        newOrder.paymentDetails = payData.paymentDetails;
      }

      if (payData.status === "approved") {
        newOrder.paymentStatus = "paid";
        newOrder.status = "in_production";
      }

      // 2. Salvar pedido no Supabase e banco de dados
      await saveNewOrderApi(newOrder);
      clearCart();
      router.push(`/order-success/${orderId}`);
    } catch (err) {
      console.error("Erro ao processar pedido e pagamento:", err);
      setErrorMessage("Ocorreu um erro ao processar seu pedido. Tente novamente.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-black text-zinc-950 font-display">
          Seu carrinho está vazio
        </h2>
        <p className="text-xs text-zinc-600 mt-2 mb-6">
          Adicione uma capinha personalizada ao seu carrinho antes de ir para o checkout.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          Voltar ao Personalizador
        </Link>
      </div>
    );
  }

  const activeShippingCost = selectedShipping !== null
    ? selectedShipping.finalPrice
    : (subtotal >= 149 || subtotal === 0 ? 0 : defaultShippingCost);

  const discountAmount = paymentMethod === "pix" ? subtotal * 0.05 : 0;
  const finalTotal = Math.max(0, subtotal + activeShippingCost - discountAmount);

  const isCPFValid = formData.cpf.replace(/\D/g, "").length === 11 ? isValidCPF(formData.cpf) : null;
  const isWhatsAppValid = formData.whatsapp.replace(/\D/g, "").length >= 10 ? isValidWhatsApp(formData.whatsapp) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Botão Voltar */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para a Loja
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">

          {/* Banner de Erro/Validação */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-950 text-xs font-semibold animate-fade-in shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Dados Pessoais */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
              <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              Dados do Comprador
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-zinc-700 font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Contato *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: formatPhoneMask(e.target.value) })}
                    className={`w-full bg-zinc-50 border rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                      isWhatsAppValid === false
                        ? "border-rose-400 focus:border-rose-600 focus:ring-rose-500/10"
                        : isWhatsAppValid === true
                        ? "border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/10"
                        : "border-zinc-200 focus:border-zinc-950 focus:ring-zinc-950/10"
                    }`}
                  />
                  {isWhatsAppValid === true && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                  )}
                </div>
                {isWhatsAppValid === false && (
                  <span className="text-[10px] font-semibold text-rose-600 mt-1 block">
                    Número de WhatsApp inválido (DDD + número)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">CPF *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPFMask(e.target.value) })}
                    className={`w-full bg-zinc-50 border rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                      isCPFValid === false
                        ? "border-rose-400 focus:border-rose-600 focus:ring-rose-500/10"
                        : isCPFValid === true
                        ? "border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/10"
                        : "border-zinc-200 focus:border-zinc-950 focus:ring-zinc-950/10"
                    }`}
                  />
                  {isCPFValid === true && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                  )}
                </div>
                {isCPFValid === false && (
                  <span className="text-[10px] font-semibold text-rose-600 mt-1 block">
                    CPF inválido (confira os 11 dígitos)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Endereço de Entrega */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
              <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              Endereço de Entrega
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">CEP *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="00000-000"
                    maxLength={9}
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: formatCEPMask(e.target.value) })}
                    onBlur={handleCepBlur}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-3 w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-700 font-semibold mb-1">Rua / Avenida *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome da rua"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: sanitizeInput(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Número *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 123"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: sanitizeInput(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-700 font-semibold mb-1">Complemento</label>
                <input
                  type="text"
                  placeholder="Apto, Bloco (Opcional)"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: sanitizeInput(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Bairro *</label>
                <input
                  type="text"
                  required
                  placeholder="Bairro"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: sanitizeInput(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Cidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: sanitizeInput(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">UF *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="SP"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: sanitizeInput(e.target.value).toUpperCase() })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Opção de Envio (Melhor Envio) */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
                <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                Opção de Envio
              </h3>
              {shippingLoading && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Calculando fretes...</span>
                </div>
              )}
            </div>

            {/* Caso ainda não tenha preenchido o CEP */}
            {(!formData.zipCode || formData.zipCode.replace(/\D/g, "").length !== 8) ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center gap-3 text-xs text-zinc-500">
                <Truck className="w-5 h-5 text-zinc-400 shrink-0" />
                <span>Preencha o CEP no endereço acima para calcular as transportadoras e prazos disponíveis.</span>
              </div>
            ) : shippingError ? (
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{shippingError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchShipping(formData.zipCode)}
                  className="text-xs font-bold underline hover:text-rose-900"
                >
                  Tentar novamente
                </button>
              </div>
            ) : shippingOptions.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {shippingOptions.map((opt) => {
                    const isSelected = selectedShipping?.id === opt.id;
                    const isFree = opt.finalPrice === 0;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedShipping(opt)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-zinc-100 border-zinc-950 ring-2 ring-zinc-950 shadow-sm"
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/80 hover:border-zinc-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-xs font-bold text-zinc-950 truncate font-display">
                              {opt.company.name} · {opt.name}
                            </span>
                            {isFree ? (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                                GRÁTIS
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>
                              {opt.deliveryTime === 1
                                ? "Chega em 1 dia útil"
                                : `Chega em até ${opt.deliveryTime} dias úteis`}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-zinc-200/70 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                            Frete
                          </span>
                          <span className="text-sm font-black text-zinc-950 font-mono">
                            {isFree ? (
                              <span className="text-emerald-700">R$ 0,00</span>
                            ) : (
                              formatCurrency(opt.finalPrice)
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {subtotal >= 149 && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Frete Grátis ativado!</strong> Você atingiu a meta de R$ 149,00 e o frete mais econômico é por nossa conta.
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* 4. Forma de Pagamento */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
                <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                Forma de Pagamento
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pagamento 100% Seguro</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opção PIX */}
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  paymentMethod === "pix"
                    ? "bg-zinc-100 border-zinc-950 ring-2 ring-zinc-950 shadow-sm"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/80 hover:border-zinc-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-zinc-950 font-bold text-xs">
                      <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>PIX</span>
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      5% OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    QR Code e Copia e Cola na hora com aprovação imediata.
                  </p>
                </div>
              </button>

              {/* Opção Cartão de Crédito */}
              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  paymentMethod === "credit_card"
                    ? "bg-zinc-100 border-zinc-950 ring-2 ring-zinc-950 shadow-sm"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/80 hover:border-zinc-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-zinc-950 font-bold text-xs">
                      <CreditCard className="w-4 h-4 text-zinc-950 shrink-0" />
                      <span>Crédito</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-200 text-zinc-800">
                      Até 6x
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    Parcelamento sem juros em todos os cartões.
                  </p>
                </div>
              </button>

              {/* Opção Cartão de Débito */}
              <button
                type="button"
                onClick={() => setPaymentMethod("debit_card")}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  paymentMethod === "debit_card"
                    ? "bg-zinc-100 border-zinc-950 ring-2 ring-zinc-950 shadow-sm"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/80 hover:border-zinc-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-zinc-950 font-bold text-xs">
                      <Wallet className="w-4 h-4 text-zinc-950 shrink-0" />
                      <span>Débito</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      À vista
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    Débito online Visa, Mastercard ou Elo.
                  </p>
                </div>
              </button>
            </div>

            {/* Campos do Cartão (Crédito ou Débito) */}
            {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3 pt-4 text-xs animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                  <span className="font-bold text-zinc-900">
                    {paymentMethod === "credit_card"
                      ? "Dados do Cartão de Crédito"
                      : "Dados do Cartão de Débito"}
                  </span>
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
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Nome impresso no Cartão *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Como consta no cartão"
                    value={cardData.name}
                    onChange={(e) =>
                      setCardData({ ...cardData, name: sanitizeInput(e.target.value).toUpperCase() })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all uppercase"
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
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 font-mono transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Código CVV *
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
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Opções de Parcelamento para Cartão de Crédito */}
                {paymentMethod === "credit_card" && (
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Opção de Parcelamento
                    </label>
                    <select
                      value={cardData.installments}
                      onChange={(e) =>
                        setCardData({ ...cardData, installments: e.target.value })
                      }
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all font-medium"
                    >
                      <option value="1">
                        1x de {formatCurrency(finalTotal)} (sem juros)
                      </option>
                      <option value="2">
                        2x de {formatCurrency(finalTotal / 2)} (sem juros)
                      </option>
                      <option value="3">
                        3x de {formatCurrency(finalTotal / 3)} (sem juros)
                      </option>
                      <option value="4">
                        4x de {formatCurrency(finalTotal / 4)} (sem juros)
                      </option>
                      <option value="5">
                        5x de {formatCurrency(finalTotal / 5)} (sem juros)
                      </option>
                      <option value="6">
                        6x de {formatCurrency(finalTotal / 6)} (sem juros)
                      </option>
                    </select>
                  </div>
                )}

                {/* Informação para Cartão de Débito */}
                {paymentMethod === "debit_card" && (
                  <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                    Pagamento à vista debitado no ato. Certifique-se de que a função de compras online no débito está liberada no seu banco.
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Ambiente seguro e criptografado com tecnologia antifraude e certificado SSL.
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-base shadow-xl shadow-zinc-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Confirmar Pedido · {formatCurrency(finalTotal)}
              </>
            )}
          </button>
        </form>

        {/* Resumo do Pedido (Coluna Direita) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-5 lg:sticky lg:top-24">
          <h3 className="text-sm font-bold text-zinc-950 font-display pb-3 border-b border-zinc-100">
            Resumo dos Itens ({items.length})
          </h3>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <div className="w-12 h-16 rounded bg-white p-1 flex items-center justify-center shrink-0 border border-zinc-200 shadow-sm">
                  <img
                    src={item.previewMockupUrl || item.customization.imageUrl}
                    alt={item.model.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 overflow-hidden">
                  <h4 className="text-xs font-bold text-zinc-950 truncate font-display">
                    {item.model.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {item.finish.name}
                  </p>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Qtd: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </span>
                </div>

                <span className="text-xs font-black text-zinc-950 font-mono shrink-0">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Cálculos */}
          <div className="space-y-2 text-xs pt-3 border-t border-zinc-100">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="text-zinc-950 font-bold font-mono">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-zinc-600">
              <span>Frete {selectedShipping ? `(${selectedShipping.company.name} · ${selectedShipping.name})` : ""}</span>
              <span className="text-zinc-950 font-bold font-mono">
                {activeShippingCost === 0 ? <strong className="text-emerald-700">GRÁTIS</strong> : formatCurrency(activeShippingCost)}
              </span>
            </div>
            {selectedShipping && (
              <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-500 font-medium">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>
                  {selectedShipping.deliveryTime === 1
                    ? "Entrega em 1 dia útil"
                    : `Entrega em até ${selectedShipping.deliveryTime} dias úteis`}
                </span>
              </div>
            )}

            {paymentMethod === "pix" && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Desconto PIX (5%)</span>
                <span className="font-mono font-bold">- {formatCurrency(subtotal * 0.05)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-zinc-950 pt-2 border-t border-zinc-200">
              <span>Total a Pagar</span>
              <span className="text-zinc-950 font-black font-mono text-2xl">
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Garantia de Satisfação
            </div>
            <p>
              Caso a capinha chegue com qualquer defeito na estampa ou encaixe, refazemos sem custo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
