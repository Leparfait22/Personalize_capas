import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const ADMIN_COOKIE_NAME = "snapcase_admin_session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Formato de credenciais inválido." },
        { status: 400 }
      );
    }

    const userEmail = email.trim().toLowerCase();
    const userPassword = password.trim();

    if (!userEmail || !userPassword) {
      return NextResponse.json(
        { error: "Por favor, informe seu e-mail e senha de acesso." },
        { status: 400 }
      );
    }

    let isAdmin = false;
    let userName = "";
    let isAuthenticated = false;

    if (isSupabaseConfigured()) {
      // 1. Autenticar usando Supabase Auth (auth.users)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });

      if (!authError && authData?.user) {
        isAuthenticated = true;
        const userMeta = authData.user.user_metadata || {};
        userName = userMeta.name || "";
        const role = userMeta.role || "customer";
        isAdmin = role === "admin";

        // Se não for admin via metadata, consultar permissão nas tabelas `profiles` e `users` pelo e-mail
        if (!isAdmin) {
          // 1. Checar na tabela profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, name")
            .eq("email", userEmail)
            .maybeSingle();

          if (profile) {
            if (profile.role === "admin") isAdmin = true;
            if (profile.name) userName = profile.name;
          }

          // 2. Checar na tabela users (caso a alteração tenha sido feita na tabela users)
          if (!isAdmin) {
            const { data: userRec } = await supabase
              .from("users")
              .select("role, name")
              .eq("email", userEmail)
              .maybeSingle();

            if (userRec) {
              if (userRec.role === "admin") isAdmin = true;
              if (userRec.name && !userName) userName = userRec.name;
            }
          }
        }
      } else {
        // Fallback: tentar verificar na tabela `users` legada
        const { data: userRecord } = await supabase
          .from("users")
          .select("*")
          .eq("email", userEmail)
          .single();

        if (userRecord && userRecord.password_hash === userPassword) {
          isAuthenticated = true;
          isAdmin = userRecord.role === "admin";
          userName = userRecord.name;
        }
      }
    }

    // 2. Fallback de Administrador via .env
    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminSecret = process.env.ADMIN_SECRET_KEY;

    if (!isAuthenticated) {
      if (envAdminEmail && envAdminSecret) {
        if (userEmail === envAdminEmail && userPassword === envAdminSecret) {
          isAuthenticated = true;
          isAdmin = true;
        }
      } else if (envAdminSecret && userPassword && userPassword === envAdminSecret) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "E-mail ou Senha Incorretos." },
        { status: 401 }
      );
    }

    try {
      const cookieStore = await cookies();

      // Define cookie de sessão HTTP-Only seguro
      cookieStore.set(
        ADMIN_COOKIE_NAME,
        JSON.stringify({
          email: userEmail,
          name: userName || (isAdmin ? "Administrador" : "Cliente"),
          isAdmin,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 dias
          path: "/",
        }
      );
    } catch (e) {
      // Fora do contexto de requisição do Next.js (ex: durante testes de unidade)
    }

    return NextResponse.json({
      success: true,
      user: {
        email: userEmail,
        name: userName || (isAdmin ? "Administrador" : "Cliente"),
        isAdmin,
      },
    });
  } catch (err) {
    console.error("Erro na rota de login:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor de autenticação" },
      { status: 500 }
    );
  }
}
