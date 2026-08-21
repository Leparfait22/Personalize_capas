"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  User,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Store,
  KeyRound,
} from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginAsAdmin, loginAsCustomer } = useAuth();
  const [activeTab, setActiveTab] = useState<"admin" | "customer">("admin");
  const [adminPin, setAdminPin] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isAuthModalOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsAdmin(adminPin);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) {
      setErrorMsg("Por favor, informe seu e-mail.");
      return;
    }
    loginAsCustomer(customerEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-zinc-900">
        {/* Botão Fechar */}
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            setErrorMsg("");
          }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-950 flex items-center justify-center border border-zinc-200">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 font-display">
              Acesso à Plataforma
            </h3>
            <p className="text-xs text-zinc-500">
              Escolha seu perfil de acesso
            </p>
          </div>
        </div>

        {/* Abas Lojista vs Cliente */}
        <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === "admin"
                ? "bg-zinc-950 text-white shadow-sm font-bold"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Lojista / Admin
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("customer");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === "customer"
                ? "bg-zinc-950 text-white shadow-sm font-bold"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Cliente
          </button>
        </div>

        {/* Tab 1: Login do Lojista */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs animate-fade-in">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2 text-zinc-950 font-bold font-display">
                <Store className="w-4 h-4 text-zinc-950" />
                Painel do Lojista & Esteira de Produção
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Acesso aos pedidos recebidos, esteira de impressão e download de arquivos em alta definição (300 DPI).
              </p>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Chave ou Senha do Lojista (Opcional no modo demo)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="admin123 ou clique em Entrar"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              Entrar como Lojista
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </form>
        )}

        {/* Tab 2: Login do Cliente */}
        {activeTab === "customer" && (
          <form onSubmit={handleCustomerSubmit} className="space-y-4 text-xs animate-fade-in">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2 text-zinc-950 font-bold font-display">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Acompanhamento de Pedidos
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Consulte o status de produção e envio das suas capinhas personalizadas.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-rose-600 text-[11px] font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <User className="w-4 h-4" />
              Entrar como Cliente
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
