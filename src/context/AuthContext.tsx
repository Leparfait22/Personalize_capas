"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAdmin: boolean;
  userEmail: string | null;
  userName: string | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; isAdmin: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: "customer" | "admin") => Promise<{ success: boolean; isAdmin: boolean; error?: string }>;
  loginAsAdmin: (password?: string) => Promise<boolean>;
  loginAsCustomer: (email: string) => void;
  logout: () => Promise<void>;
  handleUserIconClick: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = "personalize_is_admin_v1";
const USER_EMAIL_KEY = "personalize_user_email_v1";
const USER_NAME_KEY = "personalize_user_name_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Carregar status de autenticação via API (/api/auth/me) e fallback localStorage
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAdmin(Boolean(data.isAdmin));
            setUserEmail(data.userEmail || (data.isAdmin ? "admin@snapcasebr.com" : "cliente@snapcasebr.com"));
            setUserName(data.userName || (data.isAdmin ? "Administrador" : "Cliente"));
            return;
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão na API:", err);
      }

      // Fallback local
      try {
        const savedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
        const savedEmail = localStorage.getItem(USER_EMAIL_KEY);
        const savedName = localStorage.getItem(USER_NAME_KEY);
        if (savedEmail) {
          setUserEmail(savedEmail);
          setIsAdmin(savedAdmin === "true");
          setUserName(savedName || null);
        }
      } catch (e) {
        console.error("Erro ao carregar estado de autenticação local:", e);
      } finally {
        setIsLoaded(true);
      }
    }

    checkAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const loggedIsAdmin = Boolean(data.user?.isAdmin);
        const loggedEmail = data.user?.email || email || "usuario@snapcasebr.com";
        const loggedName = data.user?.name || (loggedIsAdmin ? "Administrador" : "Cliente");

        setIsAdmin(loggedIsAdmin);
        setUserEmail(loggedEmail);
        setUserName(loggedName);

        try {
          localStorage.setItem(ADMIN_STORAGE_KEY, loggedIsAdmin ? "true" : "false");
          localStorage.setItem(USER_EMAIL_KEY, loggedEmail);
          localStorage.setItem(USER_NAME_KEY, loggedName);
        } catch (e) {}

        setIsAuthModalOpen(false);
        if (loggedIsAdmin) {
          router.push("/admin");
        } else {
          router.push("/minha-conta");
        }
        return { success: true, isAdmin: loggedIsAdmin };
      } else {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, isAdmin: false, error: errorData.error || "Credenciais inválidas" };
      }
    } catch (err: any) {
      console.error("Erro ao realizar login:", err);
      return { success: false, isAdmin: false, error: "Falha de conexão ao autenticar" };
    }
  };

  const register = async (name: string, email: string, password: string, role: "customer" | "admin" = "customer") => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        const data = await res.json();
        const regIsAdmin = Boolean(data.user?.isAdmin);
        const regEmail = data.user?.email || email;
        const regName = data.user?.name || name;

        setIsAdmin(regIsAdmin);
        setUserEmail(regEmail);
        setUserName(regName);

        try {
          localStorage.setItem(ADMIN_STORAGE_KEY, regIsAdmin ? "true" : "false");
          localStorage.setItem(USER_EMAIL_KEY, regEmail);
          localStorage.setItem(USER_NAME_KEY, regName);
        } catch (e) {}

        setIsAuthModalOpen(false);
        if (regIsAdmin) {
          router.push("/admin");
        } else {
          router.push("/minha-conta");
        }
        return { success: true, isAdmin: regIsAdmin };
      } else {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, isAdmin: false, error: errorData.error || "Erro ao realizar cadastro." };
      }
    } catch (err: any) {
      console.error("Erro ao registrar usuário:", err);
      return { success: false, isAdmin: false, error: "Falha de conexão com o servidor." };
    }
  };

  const loginAsAdmin = async (password?: string): Promise<boolean> => {
    const res = await login("admin@snapcasebr.com", password);
    return res.success;
  };

  const loginAsCustomer = (email: string) => {
    login(email);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}

    setIsAdmin(false);
    setUserEmail(null);
    setUserName(null);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
      localStorage.removeItem(USER_NAME_KEY);
    } catch (e) {}
    router.push("/");
  };

  const handleUserIconClick = () => {
    if (isAdmin) {
      router.push("/admin");
    } else if (userEmail) {
      router.push("/minha-conta");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        userEmail,
        userName,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        register,
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
