"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@/types";
import { fetchSavedOrders } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  User,
  LogOut,
  Calendar,
  Clock,
  Printer,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CreditCard,
  QrCode,
  AlertCircle,
} from "lucide-react";

export default function MinhaContaPage() {
  const { userEmail, userName, isAdmin, login, register, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Estados para formulário de login/cadastro se o cliente não estiver autenticado
  const [isRegistering, setIsRegistering] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageEmail, setPageEmail] = useState("");
  const [pagePassword, setPagePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCustomerOrders = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchSavedOrders();
      setOrders(fetched);
    } catch (err) {
      console.error("Erro ao carregar pedidos do cliente:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail || isAdmin) {
      loadCustomerOrders();
    } else {
      setIsLoading(false);
    }
  }, [userEmail, isAdmin]);

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (isRegistering) {
      if (!pageName || !pageEmail || !pagePassword) {
        setLoginError("Por favor, preencha todos os campos.");
        return;
      }
      if (pagePassword.length < 6) {
        setLoginError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      setIsSubmitting(true);
      const res = await register(pageName, pageEmail, pagePassword, "customer");
      setIsSubmitting(false);
      if (!res.success && res.error) {
        setLoginError(res.error);
      } else {
        await loadCustomerOrders();
      }
    } else {
      if (!pageEmail || !pagePassword) {
        setLoginError("Por favor, preencha seu e-mail e senha.");
        return;
      }
      setIsSubmitting(true);
      const res = await login(pageEmail, pagePassword);
      setIsSubmitting(false);
      if (!res.success && res.error) {
        setLoginError(res.error);
      } else {
        await loadCustomerOrders();
      }
    }
  };

  // Se não estiver autenticado, exibe formulário limpo de acesso/cadastro do cliente
  if (!userEmail && !isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-zinc-50">
        <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl text-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center border border-zinc-800 shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-950 font-display">
                {isRegistering ? "Criar Minha Conta" : "Acessar Meus Pedidos"}
              </h1>
              <p className="text-xs text-zinc-500">
                {isRegistering
                  ? "Cadastre-se para acompanhar a produção de suas capinhas"
                  : "Entre com suas credenciais para visualizar seus pedidos"}
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {isRegistering && (
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome Completo"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3.5 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all text-xs"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                E-mail *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={pageEmail}
                  onChange={(e) => setPageEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3.5 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all text-xs"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Sua senha"
                  value={pagePassword}
                  onChange={(e) => setPagePassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-10 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all text-xs"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>{isRegistering ? "Concluir Cadastro" : "Entrar na Minha Conta"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setLoginError("");
                }}
                className="text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                {isRegistering
                  ? "Já tem uma conta? Clique aqui para entrar"
                  : "Ainda não tem conta? Cadastre-se em segundos"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtragem dos pedidos do cliente autenticado (se for admin, exibe todos; se for cliente, o backend já filtra)
  const displayOrders = orders;

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "in_production":
        return { label: "Em Produção", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "printed":
        return { label: "Impresso & Embalado", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "shipped":
        return { label: "Em Transporte", color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "completed":
        return { label: "Entregue", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      default:
        return { label: "Processando", color: "bg-zinc-100 text-zinc-800 border-zinc-200" };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-16">
      {/* Top Bar Cliente */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-zinc-950 font-display">
                  Minha Conta & Meus Pedidos
                </h1>
                {isAdmin && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Olá, <span className="font-semibold text-zinc-900">{userName || userEmail}</span>
                {userEmail && <span className="text-zinc-400"> ({userEmail})</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>Painel Lojista</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
            >
              <span>Ver Loja</span>
            </Link>

            <button
              onClick={() => logout()}
              title="Sair da Conta"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-600 rounded-xl text-xs font-bold border border-zinc-200 hover:border-rose-200 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal do Cliente */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-950 font-display flex items-center gap-2">
            <Package className="w-5 h-5 text-zinc-950" />
            Histórico de Pedidos ({displayOrders.length})
          </h2>

          <button
            onClick={loadCustomerOrders}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors underline"
          >
            Atualizar
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-500 text-xs">
            Carregando seus pedidos...
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Você ainda não realizou nenhum pedido</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Crie sua primeira capa de celular personalizada na nossa loja com a sua foto favorita!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Personalizar Capinha Agora
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {displayOrders.map((order) => {
              const statusInfo = getStatusText(order.status);
              const isPendingPayment = order.status === "pending" || order.paymentStatus === "pending";

              return (
                <div
                  key={order.id}
                  className={`bg-white border rounded-3xl p-6 shadow-sm space-y-6 transition-all ${
                    isPendingPayment
                      ? "border-slate-500 ring-2 ring-slate-400/20 hover:border-slate-400"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {/* Header do Card de Pedido */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-zinc-950 font-display">
                          Pedido #{order.orderNumber}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Realizado em {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-zinc-500">Valor Total</p>
                        <p className="text-lg font-black text-zinc-950 font-display">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      {/* Botão de Destaque no Topo para Pagar Pedido Pendente */}
                      {isPendingPayment && (
                        <Link
                          href={`/order-success/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 animate-pulse"
                          title="Concluir o pagamento deste pedido"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pagar Pedido</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Banner de Aviso e Ação de Pagamento Pendente */}
                  {isPendingPayment && (
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50/70 border border-amber-300/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                              Aguardando Pagamento
                            </h4>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                              Ação Necessária
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/90 mt-1 font-medium leading-relaxed max-w-xl">
                            Seu pedido foi registrado com sucesso! Efetue o pagamento para iniciarmos a fabricação imediata da sua capinha.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {order.paymentDetails?.pixQrCode && (
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(order.paymentDetails?.pixQrCode || "")}
                            className="px-3.5 py-2.5 bg-white hover:bg-amber-50/80 text-zinc-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                            title="Copiar código PIX Copia e Cola"
                          >
                            {copiedTracking === order.paymentDetails?.pixQrCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>PIX Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Copiar Código PIX</span>
                              </>
                            )}
                          </button>
                        )}

                        <Link
                          href={`/order-success/${order.id}`}
                          className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 group active:scale-95"
                        >
                          <QrCode className="w-4 h-4 text-emerald-400" />
                          <span>Pagar Pedido Agora</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Rastreio se disponível */}
                  {order.trackingCode && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-900">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <span>
                          Código de Rastreamento:{" "}
                          <strong className="font-mono text-sm">{order.trackingCode}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyTracking(order.trackingCode || "")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition-all"
                      >
                        {copiedTracking === order.trackingCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Rastreio</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Esteira Visual do Status */}
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-xs font-bold text-zinc-700 mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-zinc-950" />
                      Status da Confecção:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1. Pedido Recebido</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                          isPendingPayment
                            ? "bg-amber-50 border-amber-300 text-amber-800 animate-pulse"
                            : order.status !== "pending"
                            ? "bg-blue-50 border-blue-200 text-blue-800"
                            : "bg-white border-zinc-200 text-zinc-400"
                        }`}
                      >
                        {isPendingPayment ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                        <span>{isPendingPayment ? "2. Aguardando Pgto" : "2. Fila de Produção"}</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                          order.status === "printed" || order.status === "shipped" || order.status === "completed"
                            ? "bg-purple-50 border-purple-200 text-purple-800"
                            : "bg-white border-zinc-200 text-zinc-400"
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>3. Embalado</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                          order.status === "shipped" || order.status === "completed"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                            : "bg-white border-zinc-200 text-zinc-400"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>4. Em Transporte</span>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Itens no Pedido ({(order.items || []).length})
                    </p>
                    <div className="divide-y divide-zinc-100">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {(item.customization?.imageUrl || item.previewMockupUrl) && (
                              <img
                                src={item.customization?.imageUrl || item.previewMockupUrl}
                                alt={item.model?.name || "Capinha"}
                                className="w-12 h-12 object-contain rounded-xl bg-zinc-100 border border-zinc-200 p-1"
                              />
                            )}
                            <div>
                              <p className="text-xs font-bold text-zinc-950">
                                Capinha Personalizada - {item.model?.name}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Acabamento: <span className="font-semibold text-zinc-700">{item.finish?.name}</span> · Qtd: {item.quantity}x
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-zinc-950">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Endereço de Envio e Pagamento */}
                  <div className="pt-3 border-t border-zinc-100 text-xs text-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {order.shippingAddress && (
                      <p>
                        <strong className="text-zinc-900">Endereço de Entrega:</strong>{" "}
                        {order.shippingAddress.street}, {order.shippingAddress.number} -{" "}
                        {order.shippingAddress.city}/{order.shippingAddress.state} (CEP: {order.shippingAddress.zipCode})
                      </p>
                    )}
                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
