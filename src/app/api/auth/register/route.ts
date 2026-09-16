import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const ADMIN_COOKIE_NAME = "snapcase_admin_session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Formato de dados inválido. Os campos devem ser textos válidos." },
        { status: 400 }
      );
    }

    const userName = name.trim();
    const userEmail = email.trim().toLowerCase();
    const userPassword = password.trim();
    // 🔒 Segurança: Registros públicos via API são estritamente do tipo 'customer'.
    // Administradores são gerenciados via env ou banco direto.
    const userRole = "customer";

    if (!userName || !userEmail || !userPassword) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os campos obrigatórios (nome, e-mail e senha)." },
        { status: 400 }
      );
    }

    if (userPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      let userId: string | undefined;

      // 1. Tentar criar via Admin API (se SUPABASE_SERVICE_ROLE_KEY estiver disponível)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: userEmail,
            password: userPassword,
            email_confirm: true,
            user_metadata: {
              name: userName,
              role: userRole,
            },
          });

          if (adminError) {
            const msg = adminError.message.toLowerCase();
            if (msg.includes("already registered") || msg.includes("already exists")) {
              return NextResponse.json(
                { error: "Este e-mail já está cadastrado. Faça login para continuar." },
                { status: 400 }
              );
            }
          } else if (adminData?.user) {
            userId = adminData.user.id;
          }
        } catch (adminErr) {
          console.warn("Falha ao usar auth.admin.createUser, tentando signUp padrão:", adminErr);
        }
      }

      // 2. Se não criou via Admin API, tentar via signUp nativo
      if (!userId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userEmail,
          password: userPassword,
          options: {
            data: {
              name: userName,
              role: userRole,
            },
          },
        });

        if (signUpData?.user) {
          userId = signUpData.user.id;
        }

        if (signUpError) {
          const msg = signUpError.message.toLowerCase();
          if (msg.includes("already registered") || (signUpError.status === 400 && msg.includes("already"))) {
            return NextResponse.json(
              { error: "Este e-mail já está cadastrado. Faça login para continuar." },
              { status: 400 }
            );
          }

          if (msg.includes("rate limit") || signUpError.status === 429) {
            console.warn("Supabase Auth SMTP Rate Limit atingido. Salvando cadastro na tabela publica users.");
            userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          } else {
            return NextResponse.json({ error: signUpError.message }, { status: 400 });
          }
        }
      }

      // 3. Sincronizar na tabela `profiles` e `users` pública
      try {
        if (userId && userId.includes("-")) {
          await supabase.from("profiles").upsert({
            id: userId,
            name: userName,
            email: userEmail,
            role: userRole,
          }, { onConflict: "id" });
        }

        await supabase.from("users").upsert({
          id: userId || `usr_${Date.now()}`,
          name: userName,
          email: userEmail,
          password_hash: userPassword,
          role: userRole,
        }, { onConflict: "email" });
      } catch (e) {
        console.warn("Aviso ao sincronizar dados com as tabelas públicas:", e);
      }
    }

    const isAdmin = false;
    try {
      const cookieStore = await cookies();
      cookieStore.set(
        ADMIN_COOKIE_NAME,
        JSON.stringify({
          email: userEmail,
          name: userName,
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
        name: userName,
        email: userEmail,
        isAdmin,
      },
    });
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao registrar usuário" },
      { status: 500 }
    );
  }
}
