"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sanitizeInput } from "@/lib/utils";
import {
  X,
  User,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isRegistering) {
      if (!name || !email || !password) {
        setErrorMsg("Por favor, preencha nome, e-mail e senha para se cadastrar.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
        return;
      }

      setIsLoading(true);
      const res = await register(name, email, password, "customer");
      setIsLoading(false);

      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } else {
      if (!email && !password) {
        setErrorMsg("Por favor, preencha seu e-mail ou senha.");
        return;
      }

      setIsLoading(true);
      const res = await login(email, password);
      setIsLoading(false);

      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    }
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
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-white flex items-center justify-center border border-zinc-800 shadow-md">
            {isRegistering ? <UserPlus className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 font-display">
              {isRegistering ? "Criar Nova Conta" : "Acesso à Plataforma"}
            </h3>
            <p className="text-xs text-zinc-500">
              {isRegistering
                ? "Cadastre-se para acompanhar pedidos ou gerenciar a loja"
                : "Digite suas credenciais para entrar no seu painel"}
            </p>
          </div>
        </div>

        {/* Formulário de Login / Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
                  value={name}
                  onChange={(e) => setName(sanitizeInput(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
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
                value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value.trim()))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1 flex items-center justify-between">
              <span>Senha *</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={isRegistering}
                placeholder={isRegistering ? "Sua senha (mínimo 6 caracteres)" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-10 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 transition-colors p-0.5 rounded-md"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-rose-600 text-[11px] font-semibold">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" />
                Cadastrar Conta
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar na Conta
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </>
            )}
          </button>

          {/* Botão Alternar entre Login e Cadastro */}
          <div className="pt-2 text-center border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg("");
              }}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 underline underline-offset-4 transition-colors"
            >
              {isRegistering
                ? "Já possui uma conta? Faça login"
                : "Ainda não tem conta? Cadastre-se"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
