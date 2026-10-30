"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchSavedOrders,
  updateOrderStatusApi,
  fetchPhoneModelsApi,
  saveNewPhoneModelApi,
  deletePhoneModelApi,
} from "@/lib/storage";
import { Order, OrderStatus, PhoneModel, SmartphoneBrand } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Download,
  Eye,
  EyeOff,
  Phone,
  Calendar,
  Filter,
  Printer,
  Plus,
  Smartphone,
  ExternalLink,
  Search,
  ShieldCheck,
  X,
  LogOut,
  User,
  Mail,
  Lock,
  ArrowRight,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Copy,
  Check,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, userEmail, login, register, logout } = useAuth();
  const [isRegisteringPage, setIsRegisteringPage] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageEmail, setPageEmail] = useState("");
  const [pagePassword, setPagePassword] = useState("");
  const [showPagePassword, setShowPagePassword] = useState(false);
  const [pageLoginError, setPageLoginError] = useState("");
  const [isSubmittingPageLogin, setIsSubmittingPageLogin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [dateFilter, setDateFilter] = useState<"yesterday" | "today" | "week" | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modais
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<{
    mockupUrl: string;
    highResUrl: string;
    originalUrl?: string;
    modelName: string;
    finishName: string;
  } | null>(null);

  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isManageModelsOpen, setIsManageModelsOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [newModelData, setNewModelData] = useState({
    brand: "Apple" as SmartphoneBrand,
    name: "",
    tagline: "",
    basePrice: 79.90,
    widthMm: 75.0,
    heightMm: 155.0,
    cameraShape: "rounded-square" as const,
  });

  const [generatingLabelId, setGeneratingLabelId] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  const handleGenerateLabel = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const isPaid =
      targetOrder &&
      (targetOrder.paymentStatus === "paid" ||
        ["in_production", "printed", "shipped", "completed"].includes(targetOrder.status));

    if (!isPaid) {
      alert("A etiqueta só pode ser emitida após a confirmação do pagamento do pedido.");
      return;
    }

    setGeneratingLabelId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/label`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  trackingCode: data.trackingCode,
                  labelUrl: data.labelUrl,
                  shipmentId: data.shipmentId,
                  status: o.status === "pending" ? "in_production" : o.status,
                }
              : o
          )
        );
        if (data.labelUrl) {
          window.open(data.labelUrl, "_blank");
        }
      } else {
        alert(data.error || "Erro ao emitir etiqueta no Melhor Envio.");
      }
    } catch (err) {
      console.error("Erro ao emitir etiqueta:", err);
      alert("Falha de conexão com a API do Melhor Envio.");
    } finally {
      setGeneratingLabelId(null);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  const loadData = async () => {
    const fetchedOrders = await fetchSavedOrders();
    const fetchedModels = await fetchPhoneModelsApi();
    setOrders(fetchedOrders);
    setModels(fetchedModels);
  };

  useEffect(() => {
    loadData();
  }, [userEmail, isAdmin]);

  useEffect(() => {
    if (userEmail && !isAdmin) {
      router.push("/minha-conta");
    }
  }, [userEmail, isAdmin, router]);

  // Filtragem por Data
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    let matchDate = true;
    if (dateFilter === "today") {
      matchDate = orderDate >= todayStart;
    } else if (dateFilter === "yesterday") {
      matchDate = orderDate >= yesterdayStart && orderDate < yesterdayEnd;
    } else if (dateFilter === "week") {
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchDate = orderDate >= weekAgo;
    }

    let matchStatus = true;
    if (statusFilter !== "all") {
      matchStatus = order.status === statusFilter;
    }

    let matchSearch = true;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      matchSearch =
        (order.orderNumber || "").toLowerCase().includes(query) ||
        (order.customer?.name || "").toLowerCase().includes(query) ||
        (order.customer?.whatsapp || "").includes(query) ||
        (order.items || []).some((item) => (item.model?.name || "").toLowerCase().includes(query));
    }

    return matchDate && matchStatus && matchSearch;
  });

  // Estatísticas do Filtro Atual
  const totalOrdersCount = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
  const totalCasesToProduce = filteredOrders.reduce(
    (sum, ord) => sum + (ord.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 1), 0),
    0
  );

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatusApi(orderId, newStatus);
    await loadData();
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (confirm("Tem certeza que deseja remover este modelo do catálogo?")) {
      await deletePhoneModelApi(modelId);
      await loadData();
    }
  };

  const handleEditModel = (model: PhoneModel) => {
    setEditingModelId(model.id);
    setNewModelData({
      brand: model.brand,
      name: model.name,
      tagline: model.tagline || "",
      basePrice: model.basePrice,
      widthMm: model.dimensionsMm.width,
      heightMm: model.dimensionsMm.height,
      cameraShape: (model.cameraModule?.shape as any) || "rounded-square",
    });
    setIsManageModelsOpen(false);
    setIsAddModelOpen(true);
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelData.name) return;

    const id = editingModelId
      ? editingModelId
      : `${newModelData.brand.toLowerCase()}-${newModelData.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}`;

    const existingModel = models.find((m) => m.id === id);

    const newModel: PhoneModel = {
      id,
      brand: newModelData.brand,
      name: newModelData.name,
      tagline: newModelData.tagline || undefined,
      popular: existingModel?.popular ?? false,
      basePrice: Number(newModelData.basePrice),
      dimensionsMm: {
        width: Number(newModelData.widthMm),
        height: Number(newModelData.heightMm),
        thickness: existingModel?.dimensionsMm?.thickness ?? 8.0,
      },
      aspectRatio: Number(newModelData.widthMm) / Number(newModelData.heightMm),
      cornerRadius: existingModel?.cornerRadius ?? 14,
      cameraModule: {
        x: existingModel?.cameraModule?.x ?? 6,
        y: existingModel?.cameraModule?.y ?? 3.5,
        width: existingModel?.cameraModule?.width ?? 42,
        height: existingModel?.cameraModule?.height ?? 24,
        borderRadius: existingModel?.cameraModule?.borderRadius ?? 20,
        shape: newModelData.cameraShape,
        backgroundColor: existingModel?.cameraModule?.backgroundColor ?? "rgba(30, 41, 59, 0.9)",
        borderColor: existingModel?.cameraModule?.borderColor ?? "rgba(255, 255, 255, 0.2)",
        lenses: existingModel?.cameraModule?.lenses ?? [
          { x: 16, y: 8, radius: 6 },
          { x: 33, y: 19, radius: 6 },
        ],
      },
    };

    await saveNewPhoneModelApi(newModel);
    await loadData();
    setIsAddModelOpen(false);
    setEditingModelId(null);
    setNewModelData({
      brand: "Apple",
      name: "",
      tagline: "",
      basePrice: 79.90,
      widthMm: 75.0,
      heightMm: 155.0,
      cameraShape: "rounded-square",
    });
  };

  const handlePageLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageLoginError("");

    if (isRegisteringPage) {
      if (!pageName || !pageEmail || !pagePassword) {
        setPageLoginError("Por favor, preencha nome, e-mail e senha para se cadastrar.");
        return;
      }
      if (pagePassword.length < 6) {
        setPageLoginError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }

      setIsSubmittingPageLogin(true);
      const res = await register(pageName, pageEmail, pagePassword, "customer");
      setIsSubmittingPageLogin(false);

      if (!res.success && res.error) {
        setPageLoginError(res.error);
      }
    } else {
      if (!pageEmail && !pagePassword) {
        setPageLoginError("Por favor, preencha seu e-mail ou senha.");
        return;
      }
      setIsSubmittingPageLogin(true);
      const res = await login(pageEmail, pagePassword);
      setIsSubmittingPageLogin(false);

      if (!res.success && res.error) {
        setPageLoginError(res.error);
      }
    }
  };

  // 1. Tela de Login se não estiver autenticado (sem e-mail e sem admin)
  if (!userEmail && !isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-zinc-50">
        <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl text-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center border border-zinc-800 shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-950 font-display">
                {isRegisteringPage ? "Criar Nova Conta" : "Acesso à Plataforma"}
              </h1>
              <p className="text-xs text-zinc-500">
                {isRegisteringPage
                  ? "Cadastre suas credenciais para acessar seu painel"
                  : "Digite suas credenciais de login para acessar seu painel"}
              </p>
            </div>
          </div>

          <form onSubmit={handlePageLoginSubmit} className="space-y-4 text-xs">
            {isRegisteringPage && (
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
              <label className="block text-zinc-700 font-semibold mb-1 flex items-center justify-between">
                <span>Senha *</span>
              </label>
              <div className="relative">
                <input
                  type={showPagePassword ? "text" : "password"}
                  required={isRegisteringPage}
                  placeholder={isRegisteringPage ? "Sua senha (mínimo 6 caracteres)" : "Sua senha"}
                  value={pagePassword}
                  onChange={(e) => setPagePassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-10 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all text-xs"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPagePassword(!showPagePassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 transition-colors p-0.5 rounded-md"
                  title={showPagePassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPagePassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {pageLoginError && (
              <p className="text-rose-600 text-[11px] font-semibold">{pageLoginError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmittingPageLogin}
              className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 transition-all hover:scale-[1.01]"
            >
              {isSubmittingPageLogin ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegisteringPage ? (
                <>
                  <User className="w-4 h-4" />
                  Cadastrar Conta
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Entrar na Conta
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </>
              )}
            </button>

            <div className="pt-2 text-center border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setIsRegisteringPage(!isRegisteringPage);
                  setPageLoginError("");
                }}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 underline underline-offset-4 transition-colors"
              >
                {isRegisteringPage
                  ? "Já possui uma conta? Faça login"
                  : "Ainda não tem conta? Cadastre-se"}
              </button>
            </div>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold underline underline-offset-4"
            >
              Voltar para a loja de capinhas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Redirecionamento se for usuário simples (não-admin)
  if (!isAdmin && userEmail) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-zinc-50">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-600 animate-pulse">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-zinc-900">Redirecionando para sua conta...</h2>
          <p className="text-xs text-zinc-500">
            A rota /admin é restrita à produção e gestão do lojista. Redirecionando você para a área do cliente.
          </p>
          <Link
            href="/minha-conta"
            className="inline-block px-5 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-zinc-800 transition-all"
          >
            Acessar Meus Pedidos
          </Link>
        </div>
      </div>
    );
  }

  // 3. PAINEL DO ADMIN / LOJISTA (Renderização quando isAdmin === true)

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-16">
      {/* Top Bar Admin */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-zinc-950 font-display">
                  Produção & Pedidos
                </h1>
                
              </div>
              
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsManageModelsOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 transition-colors shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-zinc-950" />
              Gerenciar Modelos ({models.length})
            </button>

            <button
              onClick={() => {
                setEditingModelId(null);
                setNewModelData({
                  brand: "Apple",
                  name: "",
                  tagline: "",
                  basePrice: 79.90,
                  widthMm: 75.0,
                  heightMm: 155.0,
                  cameraShape: "rounded-square",
                });
                setIsAddModelOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              Novo Modelo
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-md shadow-zinc-950/20"
            >
              <span>Ver Loja</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => logout()}
              title="Desconectar do Painel"
              className="p-2 bg-zinc-100 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 rounded-xl border border-zinc-200 hover:border-rose-200 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filtro Principal de Data (Destaque para "Pedidos de Ontem") */}
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4 h-4 text-zinc-950" />
              <span className="text-xs font-bold text-zinc-700 font-display">Período de Produção:</span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200 w-full sm:w-auto">
              <button
                onClick={() => setDateFilter("yesterday")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all text-center ${
                  dateFilter === "yesterday"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Pedidos de Ontem
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all text-center ${
                  dateFilter === "today"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setDateFilter("week")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all text-center ${
                  dateFilter === "week"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => setDateFilter("all")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all text-center ${
                  dateFilter === "all"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Busca & Filtro de Status */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar cliente, nº ou modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-zinc-950"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="in_production">Em Produção</option>
              <option value="printed">Impresso / Pronto</option>
              <option value="shipped">Enviado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-semibold text-zinc-500">Total de Pedidos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-950 font-display">
                {totalOrdersCount}
              </span>
              <span className="text-xs text-zinc-500 font-medium">no período selecionado</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-semibold text-zinc-500">Capinhas para Impressão</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 font-display">
                {totalCasesToProduce}
              </span>
              <span className="text-xs text-zinc-500">unidades totais</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-semibold text-zinc-500">Faturamento do Período</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-950 font-display">
                {formatCurrency(totalRevenue)}
              </span>
              <span className="text-xs text-emerald-700 font-bold">
                {totalOrdersCount > 0 ? `(Méd. ${formatCurrency(totalRevenue / totalOrdersCount)})` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos da Fila de Produção */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-zinc-950" />
              <h2 className="text-sm font-black text-zinc-950 font-display">
                Fila de Pedidos & Arquivos para Impressão
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              Mostrando {filteredOrders.length} pedido(s)
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-800">
                Nenhum pedido encontrado para o filtro atual
              </p>
              <p className="text-xs text-zinc-500">
                Alterne o filtro para "Hoje", "Últimos 7 dias" ou cadastre um pedido na loja.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-6 bg-zinc-100/50">
              {filteredOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="p-6 bg-white rounded-2xl border border-zinc-200/90 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden pl-7 sm:pl-8"
                >
                  {/* Indicador Visual / Separador Lateral Colorido por Status */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-2.5 ${
                      order.status === "completed"
                        ? "bg-emerald-500"
                        : order.status === "shipped"
                        ? "bg-indigo-500"
                        : order.status === "printed"
                        ? "bg-purple-500"
                        : order.status === "in_production"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  />

                  {/* Topo do Pedido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-zinc-400 font-mono">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-sm font-black text-zinc-950 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80 shadow-xs">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {order.paymentMethod === "pix" ? "PIX" : "Cartão"} ·{" "}
                        {order.paymentStatus === "paid" ? "PAGO" : "AGUARDANDO PAGTO"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-semibold">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`text-xs font-bold rounded-xl px-3 py-1.5 border shadow-xs focus:outline-none transition-colors cursor-pointer ${
                          order.status === "in_production"
                            ? "bg-blue-50 text-blue-900 border-blue-200"
                            : order.status === "printed"
                            ? "bg-purple-50 text-purple-900 border-purple-200"
                            : order.status === "shipped"
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : "bg-zinc-100 text-zinc-800 border-zinc-200"
                        }`}
                      >
                        <option value="pending">⏳ Pendente</option>
                        <option value="in_production">⚙️ Em Produção</option>
                        <option value="printed">🖨️ Impresso / Embalado</option>
                        <option value="shipped">🚚 Enviado</option>
                        <option value="completed">✅ Concluído</option>
                      </select>
                    </div>
                  </div>

                  {/* Detalhes do Comprador e Endereço */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-zinc-50/70 p-4 rounded-xl border border-zinc-100">
                    {/* Cliente */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Comprador
                      </span>
                      <p className="font-black text-zinc-950 text-sm font-display">{order.customer.name}</p>
                      <p className="text-zinc-600">{order.customer.email}</p>
                      <p className="text-zinc-500 font-mono">CPF: {order.customer.cpf}</p>
                      <a
                        href={`https://wa.me/55${order.customer.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold pt-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        WhatsApp: {order.customer.whatsapp}
                      </a>
                    </div>

                    {/* Endereço de Envio */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Endereço de Entrega
                      </span>
                      <p className="text-zinc-700 font-medium">
                        {order.shippingAddress.street}, {order.shippingAddress.number}{" "}
                        {order.shippingAddress.complement ? `(${order.shippingAddress.complement})` : ""}
                      </p>
                      <p className="text-zinc-500">
                        {order.shippingAddress.neighborhood} · {order.shippingAddress.city} - {order.shippingAddress.state}
                      </p>
                      <p className="font-mono text-zinc-500">CEP: {order.shippingAddress.zipCode}</p>
                    </div>

                    {/* Financeiro */}
                    <div className="space-y-1 md:text-right">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Valor Total
                      </span>
                      <p className="text-lg font-black text-zinc-950 font-mono">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-zinc-500 text-[11px]">
                        Itens: {formatCurrency(order.subtotal)} | Frete: {order.shippingCost === 0 ? "Grátis" : formatCurrency(order.shippingCost)}
                        {order.shippingMethod && (
                          <span className="text-zinc-700 font-medium"> ({order.shippingMethod.company} {order.shippingMethod.name} · {order.shippingMethod.deliveryTime}d)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Envio & Emissão de Etiqueta (Melhor Envio) */}
                  <div className="p-3 bg-zinc-100/70 rounded-xl border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-xs shrink-0">
                        <Truck className="w-4 h-4 text-zinc-800" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-950 font-display">
                            {order.shippingMethod
                              ? `${order.shippingMethod.company} (${order.shippingMethod.name})`
                              : "Frete Melhor Envio"}
                          </span>
                          {order.labelUrl ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Etiqueta Emitida
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                              Etiqueta Não Emitida
                            </span>
                          )}
                        </div>

                        {order.trackingCode && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[11px] text-zinc-500">Rastreio:</span>
                            <span className="text-[11px] font-mono font-bold text-zinc-950 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                              {order.trackingCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(order.trackingCode!)}
                              className="text-[11px] text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copiar código de rastreamento"
                            >
                              {copiedTracking === order.trackingCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedTracking === order.trackingCode ? "Copiado!" : "Copiar"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.labelUrl ? (
                        <a
                          href={order.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Etiqueta (PDF)</span>
                        </a>
                      ) : (() => {
                        const isPaid =
                          order.paymentStatus === "paid" ||
                          ["in_production", "printed", "shipped", "completed"].includes(order.status);

                        if (!isPaid) {
                          return (
                            <button
                              type="button"
                              disabled
                              title="O pagamento ainda não foi confirmado!"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 border border-zinc-200/90 text-zinc-400 rounded-lg text-xs font-semibold cursor-not-allowed select-none transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Gerar Etiqueta (Aguardando Pagamento)</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            disabled={generatingLabelId === order.id}
                            onClick={() => handleGenerateLabel(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                          >
                            {generatingLabelId === order.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Emitindo Etiqueta...</span>
                              </>
                            ) : (
                              <>
                                <Tag className="w-3.5 h-3.5 text-zinc-300" />
                                <span>Gerar Etiqueta (Melhor Envio)</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Itens do Pedido + Botões de Download de Arte */}
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                      Capinhas Personalizadas para Produção ({order.items.length})
                    </span>

                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-20 bg-zinc-50 rounded-lg p-1 border border-zinc-200 shadow-xs flex items-center justify-center shrink-0">
                              <img
                                src={item.previewMockupUrl || item.customization.imageUrl}
                                alt={item.model.name}
                                className="w-full h-full object-contain drop-shadow"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black text-zinc-950 font-display">
                                {item.model.name} ({item.quantity} un)
                              </h4>
                              <p className="text-[11px] text-zinc-500 font-medium">{item.finish.name}</p>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                                <span className="font-mono">
                                  {item.model.dimensionsMm.width} × {item.model.dimensionsMm.height} mm
                                </span>
                                <span>·</span>
                                <span>Cor: {item.caseColor === "transparent" ? "Transparente" : "Colorida"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Ações de Impressão, Foto Original e Preview */}
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPreviewItem({
                                  mockupUrl: item.previewMockupUrl || item.customization.imageUrl,
                                  highResUrl: item.highResPrintUrl || item.customization.imageUrl,
                                  originalUrl: item.customization.imageUrl,
                                  modelName: item.model.name,
                                  finishName: item.finish.name,
                                })
                              }
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-bold border border-zinc-200 transition-colors shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Mockup
                            </button>

                            {item.customization?.imageUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadImage(
                                    item.customization.imageUrl,
                                    `FOTO_ORIGINAL_${order.orderNumber}_${item.model.id}`
                                  )
                                }
                                title="Baixar a imagem bruta original enviada pelo cliente"
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold border border-zinc-200 transition-colors shadow-xs"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                                Foto Original
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadImage(
                                  item.highResPrintUrl || item.customization.imageUrl,
                                  `ARTE_${order.orderNumber}_${item.model.id}`
                                )
                              }
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold shadow-md shadow-zinc-950/20 transition-all hover:scale-105 active:scale-95"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Baixar Arte (300 DPI)
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Visualizador de Mockup / Arte */}
      {selectedPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-zinc-900">
            <button
              onClick={() => setSelectedPreviewItem(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 rounded-lg hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-zinc-950 font-display">
                Conferência de Mockup: {selectedPreviewItem.modelName}
              </h3>
              <p className="text-xs text-zinc-500">{selectedPreviewItem.finishName}</p>
            </div>

            <div className="flex justify-center p-6 bg-zinc-100 rounded-xl border border-zinc-200">
              <img
                src={selectedPreviewItem.mockupUrl}
                alt="Mockup do Celular"
                className="max-h-[380px] w-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedPreviewItem(null)}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200"
              >
                Fechar
              </button>
              {selectedPreviewItem.originalUrl && (
                <button
                  onClick={() => {
                    handleDownloadImage(
                      selectedPreviewItem.originalUrl!,
                      `FOTO_ORIGINAL_${selectedPreviewItem.modelName.replace(/\s+/g, "_")}`
                    );
                  }}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold border border-zinc-200 flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-700" />
                  Foto Original
                </button>
              )}
              <button
                onClick={() => {
                  handleDownloadImage(
                    selectedPreviewItem.highResUrl,
                    `ARTE_${selectedPreviewItem.modelName.replace(/\s+/g, "_")}`
                  );
                }}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-zinc-950/20"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arte Pronta (300 DPI)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Cadastro de Novo Modelo de Celular */}
      {isAddModelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-zinc-900">
            <button
              onClick={() => setIsAddModelOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 rounded-lg hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center border border-zinc-200">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-950 font-display">
                  {editingModelId ? "Editar Modelo" : "Cadastrar Novo Modelo"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {editingModelId
                    ? "Atualize as informações do aparelho selecionado."
                    : "Adicione novos smartphones ao catálogo da sua loja."}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Marca *</label>
                <select
                  value={newModelData.brand}
                  onChange={(e) =>
                    setNewModelData({
                      ...newModelData,
                      brand: e.target.value as SmartphoneBrand,
                    })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 font-medium focus:outline-none focus:border-zinc-950"
                >
                  <option value="Apple">Apple iPhone</option>
                  <option value="Samsung">Samsung Galaxy</option>
                  <option value="Xiaomi">Xiaomi / Redmi</option>
                  <option value="Motorola">Motorola</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Nome do Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: iPhone 17 Pro ou Moto Edge 50"
                  value={newModelData.name}
                  onChange={(e) =>
                    setNewModelData({ ...newModelData, name: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Subtítulo / Tagline (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Display 6.7&quot; Super Retina / Titânio"
                  value={newModelData.tagline}
                  onChange={(e) =>
                    setNewModelData({ ...newModelData, tagline: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newModelData.basePrice}
                    onChange={(e) =>
                      setNewModelData({
                        ...newModelData,
                        basePrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Formato Câmera</label>
                  <select
                    value={newModelData.cameraShape}
                    onChange={(e) =>
                      setNewModelData({
                        ...newModelData,
                        cameraShape: e.target.value as any,
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-950"
                  >
                    <option value="rounded-square">Quadrada (iPhone/Redmi)</option>
                    <option value="linear-column">Vertical (Galaxy S24)</option>
                    <option value="island-triple">Tripla (Pro/Pro Max)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newModelData.widthMm}
                    onChange={(e) =>
                      setNewModelData({
                        ...newModelData,
                        widthMm: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newModelData.heightMm}
                    onChange={(e) =>
                      setNewModelData({
                        ...newModelData,
                        heightMm: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModelOpen(false);
                    setEditingModelId(null);
                  }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold border border-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold shadow-md shadow-zinc-950/20"
                >
                  {editingModelId ? "Atualizar Modelo" : "Salvar Modelo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Gerenciar / Remover Modelos Existentes */}
      {isManageModelsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative text-zinc-900">
            <button
              onClick={() => setIsManageModelsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 rounded-lg hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center border border-zinc-200">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-950 font-display">
                  Gerenciar Modelos ({models.length})
                </h3>
                <p className="text-xs text-zinc-500">
                  Lista de aparelhos cadastrados no catálogo da loja.
                </p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl p-2 bg-zinc-50 space-y-1">
              {models.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Nenhum modelo cadastrado.
                </div>
              ) : (
                models.map((model) => (
                  <div
                    key={model.id}
                    className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-white rounded-lg transition-colors"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                          {model.brand}
                        </span>
                        <p className="text-xs font-bold text-zinc-950 font-display truncate">
                          {model.name}
                        </p>
                      </div>
                      {model.tagline && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {model.tagline}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-zinc-950 mr-1">
                        {formatCurrency(model.basePrice)}
                      </span>
                      <button
                        onClick={() => handleEditModel(model)}
                        title="Editar modelo"
                        className="p-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950 rounded-lg transition-colors border border-zinc-200"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        title="Remover modelo"
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsManageModelsOpen(false);
                  setIsAddModelOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold border border-zinc-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Novo Modelo
              </button>
              <button
                onClick={() => setIsManageModelsOpen(false)}
                className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
