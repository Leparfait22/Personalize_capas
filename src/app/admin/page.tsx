"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSavedOrders, updateOrderStatus, getStoredPhoneModels, saveNewPhoneModel } from "@/lib/storage";
import { Order, OrderStatus, PhoneModel, SmartphoneBrand } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Download,
  Eye,
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const { isAdmin, logout, loginAsAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [dateFilter, setDateFilter] = useState<"yesterday" | "today" | "week" | "all">("yesterday");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modais
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<{
    mockupUrl: string;
    highResUrl: string;
    modelName: string;
    finishName: string;
  } | null>(null);

  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [newModelData, setNewModelData] = useState({
    brand: "Apple" as SmartphoneBrand,
    name: "",
    basePrice: 59.90,
    widthMm: 75.0,
    heightMm: 155.0,
    cameraShape: "rounded-square" as const,
  });

  const loadData = () => {
    setOrders(getSavedOrders());
    setModels(getStoredPhoneModels());
  };

  useEffect(() => {
    loadData();
  }, []);

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
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.whatsapp.includes(query) ||
        order.items.some((item) => item.model.name.toLowerCase().includes(query));
    }

    return matchDate && matchStatus && matchSearch;
  });

  // Estatísticas do Filtro Atual
  const totalOrdersCount = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalCasesToProduce = filteredOrders.reduce(
    (sum, ord) => sum + ord.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    loadData();
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelData.name) return;

    const id = `${newModelData.brand.toLowerCase()}-${newModelData.name.toLowerCase().replace(/\s+/g, "-")}`;
    const newModel: PhoneModel = {
      id,
      brand: newModelData.brand,
      name: newModelData.name,
      basePrice: Number(newModelData.basePrice),
      dimensionsMm: {
        width: Number(newModelData.widthMm),
        height: Number(newModelData.heightMm),
        thickness: 8.0,
      },
      aspectRatio: Number(newModelData.widthMm) / Number(newModelData.heightMm),
      cornerRadius: 14,
      cameraModule: {
        x: 6,
        y: 3.5,
        width: 42,
        height: 24,
        borderRadius: 20,
        shape: newModelData.cameraShape,
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        lenses: [
          { x: 16, y: 8, radius: 6 },
          { x: 33, y: 19, radius: 6 },
        ],
      },
    };

    saveNewPhoneModel(newModel);
    loadData();
    setIsAddModelOpen(false);
    setNewModelData({
      brand: "Apple",
      name: "",
      basePrice: 59.90,
      widthMm: 75.0,
      heightMm: 155.0,
      cameraShape: "rounded-square",
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-950 flex items-center justify-center border border-zinc-200 mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-zinc-950 font-display">Área Restrita do Lojista</h1>
        <p className="text-xs text-zinc-600 mt-2 mb-6">
          Identificamos que você ainda não está autenticado como administrador ou lojista da plataforma.
        </p>
        <div className="space-y-3 w-full">
          <button
            onClick={() => loginAsAdmin()}
            className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 transition-all hover:scale-[1.01]"
          >
            <ShieldCheck className="w-4 h-4" />
            Entrar como Administrador / Lojista
          </button>
          <Link
            href="/"
            className="w-full block py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs border border-zinc-200 transition-colors"
          >
            Voltar para a Loja
          </Link>
        </div>
      </div>
    );
  }

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
                  Painel de Produção & Pedidos
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Lojista Ativo
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Gerencie a esteira de impressão e baixe os arquivos em alta resolução (300 DPI).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAddModelOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              Cadastrar Novo Modelo
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
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-950" />
            <span className="text-xs font-bold text-zinc-700 font-display">Período de Produção:</span>
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setDateFilter("yesterday")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === "yesterday"
                    ? "bg-zinc-950 text-white shadow-sm font-bold"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                📅 Pedidos de Ontem
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === "today"
                    ? "bg-zinc-950 text-white shadow-sm font-bold"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setDateFilter("week")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === "week"
                    ? "bg-zinc-950 text-white shadow-sm font-bold"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => setDateFilter("all")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === "all"
                    ? "bg-zinc-950 text-white shadow-sm font-bold"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Busca & Filtro de Status */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
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
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-zinc-950"
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
            <div className="divide-y divide-zinc-200">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-5 hover:bg-zinc-50/60 transition-colors space-y-4">
                  {/* Topo do Pedido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-zinc-950 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(order.createdAt)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
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
                      </p>
                    </div>
                  </div>

                  {/* Itens do Pedido + Botões de Download de Arte */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                      Capinhas Personalizadas para Produção ({order.items.length})
                    </span>

                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-20 bg-white rounded-lg p-1 border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
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

                          {/* Ações de Impressão e Preview */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPreviewItem({
                                  mockupUrl: item.previewMockupUrl || item.customization.imageUrl,
                                  highResUrl: item.highResPrintUrl || item.customization.imageUrl,
                                  modelName: item.model.name,
                                  finishName: item.finish.name,
                                })
                              }
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-bold border border-zinc-200 transition-colors shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Mockup
                            </button>

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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedPreviewItem(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200"
              >
                Fechar
              </button>
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
                Baixar Imagem em Alta Resolução
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
                  Cadastrar Novo Modelo
                </h3>
                <p className="text-xs text-zinc-500">
                  Adicione novos smartphones ao catálogo da sua loja.
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
                  onClick={() => setIsAddModelOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold border border-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold shadow-md shadow-zinc-950/20"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
