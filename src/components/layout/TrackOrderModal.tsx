"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { formatCurrency, formatCPFMask, formatDateShort, sanitizeInput } from "@/lib/utils";
import {
  X,
  Search,
  Package,
  CheckCircle2,
  Printer,
  Truck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
} from "lucide-react";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanedQuery = sanitizeInput(query.trim());
    if (!cleanedQuery || cleanedQuery.length < 3) {
      setErrorMsg("Digite ao menos 3 caracteres (CPF, e-mail ou número do pedido).");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(cleanedQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Erro ao buscar pedido:", err);
      setErrorMsg("Ocorreu um erro ao consultar o pedido. Tente novamente.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    // Se forem apenas dígitos, aplica máscara de CPF
    const digits = val.replace(/\D/g, "");
    if (digits.length > 0 && digits.length === val.length) {
      setQuery(formatCPFMask(val));
    } else {
      setQuery(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative text-zinc-900 max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center border border-zinc-800 shadow-md">
            <Package className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-950 font-display">
              Rastrear Meu Pedido
            </h3>
            <p className="text-xs text-zinc-500">
              Digite seu CPF, e-mail de compra ou número do pedido (Ex: SC-8921)
            </p>
          </div>
        </div>

        {/* Formulário de Busca */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Digite o CPF, E-mail ou Número do Pedido..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-24 py-3.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-4" />

            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Buscar"
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-rose-600 text-xs font-semibold flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </p>
          )}
        </form>

        {/* Resultados da Busca */}
        {searched && !loading && (
          <div className="space-y-4 pt-2">
            {orders.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-950">Nenhum pedido encontrado</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Confira se digitou os números do CPF ou o e-mail corretamente sem erros de digitação.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Localizamos {orders.length} pedido(s):
                </span>

                {orders.map((ord) => {
                  const isPaid = ord.paymentStatus === "paid";
                  const statusMap: Record<string, { label: string; color: string }> = {
                    pending: { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-800 border-amber-200" },
                    in_production: { label: "Em Produção UV", color: "bg-blue-100 text-blue-800 border-blue-200" },
                    printed: { label: "Impressão Concluída", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
                    shipped: { label: "Enviado / Em Transporte", color: "bg-purple-100 text-purple-800 border-purple-200" },
                    completed: { label: "Entregue", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                  };
                  const currStatus = statusMap[ord.status] || { label: ord.status, color: "bg-zinc-100 text-zinc-800" };

                  const isPrinting = ord.status === "in_production" || ord.status === "printed" || ord.status === "shipped" || ord.status === "completed";
                  const isPacking = ord.status === "printed" || ord.status === "shipped" || ord.status === "completed";
                  const isShipped = ord.status === "shipped" || ord.status === "completed";

                  return (
                    <div
                      key={ord.id}
                      className="p-5 bg-zinc-50/70 rounded-2xl border border-zinc-200 space-y-4 hover:border-zinc-300 transition-all shadow-sm"
                    >
                      {/* Topo do Pedido */}
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-zinc-950">
                              #{ord.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currStatus.color}`}
                            >
                              {currStatus.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Comprado em {formatDateShort(ord.createdAt)}
                          </span>
                        </div>

                        <span className="text-sm font-black text-zinc-950 font-mono">
                          {formatCurrency(ord.totalAmount)}
                        </span>
                      </div>

                      {/* Progresso do Pedido */}
                      <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
                        <div className="space-y-1">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-zinc-900 block">Recebido</span>
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                              isPrinting
                                ? "bg-zinc-950 text-white shadow-sm"
                                : "bg-zinc-200 text-zinc-400"
                            }`}
                          >
                            <Printer className="w-3 h-3" />
                          </div>
                          <span className="font-semibold text-zinc-700 block">Impressão</span>
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                              isPacking
                                ? "bg-zinc-950 text-white shadow-sm"
                                : "bg-zinc-200 text-zinc-400"
                            }`}
                          >
                            <Package className="w-3 h-3" />
                          </div>
                          <span className="font-semibold text-zinc-700 block">Embalagem</span>
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                              isShipped
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-zinc-200 text-zinc-400"
                            }`}
                          >
                            <Truck className="w-3 h-3" />
                          </div>
                          <span className="font-semibold text-zinc-700 block">Envio</span>
                        </div>
                      </div>

                      {/* Itens do Pedido */}
                      <div className="space-y-2 pt-1">
                        {ord.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 bg-white rounded-xl border border-zinc-200/90 text-xs"
                          >
                            <div className="w-9 h-12 rounded bg-zinc-50 p-1 flex items-center justify-center shrink-0 border border-zinc-100">
                              <img
                                src={item.previewMockupUrl || item.customization.imageUrl}
                                alt={item.model.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h5 className="font-bold text-zinc-950 truncate">{item.model.name}</h5>
                              <p className="text-[11px] text-zinc-500 truncate">{item.finish.name}</p>
                            </div>
                            <span className="font-mono text-xs font-bold text-zinc-900">
                              Qtd: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Link completo do pedido */}
                      <div className="pt-2">
                        <Link
                          href={`/order-success/${ord.id}`}
                          onClick={onClose}
                          className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <span>Ver Detalhes Completos e Rastreio</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
