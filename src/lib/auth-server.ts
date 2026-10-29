import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "snapcase_admin_session";

export interface ServerSession {
  email: string;
  isAdmin: boolean;
}

/**
 * Obtém a sessão autenticada do lado do SERVIDOR via Cookie HTTP-Only seguro.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    let data: any = null;
    try {
      data = JSON.parse(sessionCookie.value);
    } catch {
      data = JSON.parse(decodeURIComponent(sessionCookie.value));
    }

    if (!data) return null;

    return {
      email: data.email || "",
      isAdmin: Boolean(data.isAdmin),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Verifica se a requisição do servidor pertence a um Administrador/Lojista válido.
 */
export async function isServerAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return Boolean(session && session.isAdmin);
}
