"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { saveNewOrder } from "@/lib/storage";
import { Order } from "@/types";
import {
  Lock,
  Truck,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  Search,
  Check,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingCost, total, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

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

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    installments: "1",
  });

  // Busca CEP automático via ViaCEP
  const handleCepBlur = async () => {
    const cleanCep = formData.zipCode.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `SC-${randomNum}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: orderNumber,
      customer: {
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cpf: formData.cpf,
      },
      shippingAddress: {
        zipCode: formData.zipCode,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      },
      items: [...items],
      subtotal,
      shippingCost,
      discount: paymentMethod === "pix" ? subtotal * 0.05 : 0,
      totalAmount: paymentMethod === "pix" ? total - subtotal * 0.05 : total,
      paymentMethod,
      paymentStatus: paymentMethod === "pix" ? "pending" : "paid",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Salvar pedido no storage
    saveNewOrder(newOrder);

    setTimeout(() => {
      clearCart();
      router.push(`/order-success/${orderId}`);
    }, 600);
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

  const finalTotal = paymentMethod === "pix" ? total - subtotal * 0.05 : total;

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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">WhatsApp (para rastreio) *</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">CPF (para nota fiscal) *</label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
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
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-700 font-semibold mb-1">Complemento</label>
                <input
                  type="text"
                  placeholder="Apto, Bloco (Opcional)"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Forma de Pagamento */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2 font-display">
              <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              Forma de Pagamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção PIX */}
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  paymentMethod === "pix"
                    ? "bg-zinc-100 border-zinc-950 ring-2 ring-zinc-950"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-zinc-950 font-bold text-xs">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    PIX Instantâneo
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    5% OFF
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Aprovação imediata na esteira de produção.
                </p>
              </button>

              {/* Opção Cartão de Crédito */}
              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  paymentMethod === "credit_card"
                    ? "bg-zinc-100 border-zinc-950 ring-2 ring-zinc-950"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-zinc-950 font-bold text-xs">
                    <CreditCard className="w-4 h-4 text-zinc-950" />
                    Cartão de Crédito
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                    Até 3x sem juros
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Visa, Mastercard, Elo, Hipercard.
                </p>
              </button>
            </div>

            {/* Campos do Cartão se selecionado */}
            {paymentMethod === "credit_card" && (
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3 pt-4 text-xs animate-fade-in">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Número do Cartão</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Validade (MM/AA)</label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />
                  </div>
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
              <span>Frete</span>
              <span className="text-zinc-950 font-bold font-mono">
                {shippingCost === 0 ? <strong className="text-emerald-700">GRÁTIS</strong> : formatCurrency(shippingCost)}
              </span>
            </div>

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
