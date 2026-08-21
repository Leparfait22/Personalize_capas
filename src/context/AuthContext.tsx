"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAdmin: boolean;
  userEmail: string | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginAsAdmin: (password?: string) => boolean;
  loginAsCustomer: (email: string) => void;
  logout: () => void;
  handleUserIconClick: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = "personalize_is_admin_v1";
const USER_EMAIL_KEY = "personalize_user_email_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Carregar status de autenticação do localStorage
  useEffect(() => {
    try {
      const savedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      const savedEmail = localStorage.getItem(USER_EMAIL_KEY);
      if (savedAdmin === "true") {
        setIsAdmin(true);
      }
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    } catch (e) {
      console.error("Erro ao carregar estado de autenticação:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const loginAsAdmin = (password?: string): boolean => {
    // Para facilidade de uso/demonstração aceita admin123 ou clique direto
    setIsAdmin(true);
    setUserEmail("admin@personalizecases.com.br");
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, "true");
      localStorage.setItem(USER_EMAIL_KEY, "admin@personalizecases.com.br");
    } catch (e) {
      console.error("Erro ao salvar login admin:", e);
    }
    setIsAuthModalOpen(false);
    router.push("/admin");
    return true;
  };

  const loginAsCustomer = (email: string) => {
    setIsAdmin(false);
    setUserEmail(email);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, "false");
      localStorage.setItem(USER_EMAIL_KEY, email);
    } catch (e) {
      console.error("Erro ao salvar login cliente:", e);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setIsAdmin(false);
    setUserEmail(null);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }
    router.push("/");
  };

  const handleUserIconClick = () => {
    if (isAdmin) {
      // Se for admin, leva direto para a Área do Lojista
      router.push("/admin");
    } else {
      // Se não for admin, abre o modal de login/acesso
      setIsAuthModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        userEmail,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginAsAdmin,
        loginAsCustomer,
        logout,
        handleUserIconClick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
