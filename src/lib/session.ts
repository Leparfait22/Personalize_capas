"use client";

const SESSION_STORAGE_KEY = "personalize_cart_session_id_v1";

/**
 * Obtém ou gera um ID de sessão único para o carrinho do visitante (Guest Cart)
 * Armazenado em localStorage e cookies para persistência entre sessões
 */
export function getOrCreateCartSessionId(): string {
  if (typeof window === "undefined") return "server_session";

  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }

    return sessionId;
  } catch {
    return `guest_fallback_${Date.now()}`;
  }
}
