import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { INITIAL_PHONE_MODELS } from "@/data/catalog";
import { PhoneModel } from "@/types";
import { isServerAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("phone_models")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted: PhoneModel[] = data.map((item) => ({
          id: item.id,
          brand: item.brand,
          name: item.name,
          tagline: item.tagline,
          popular: item.popular,
          basePrice: Number(item.base_price),
          dimensionsMm: item.dimensions_mm,
          aspectRatio: Number(item.aspect_ratio),
          cornerRadius: Number(item.corner_radius || 14),
          cameraModule: item.camera_module,
        }));
        return NextResponse.json(formatted);
      }
    }
  } catch (err) {
    console.error("Erro ao buscar modelos do Supabase, usando catálogo local:", err);
  }

  // Fallback para catálogo inicial
  return NextResponse.json(INITIAL_PHONE_MODELS);
}

export async function POST(request: Request) {
  // 🔒 Proteção Server-Side: Apenas administradores autenticados podem cadastrar modelos
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem cadastrar modelos." },
      { status: 403 }
    );
  }

  try {
    const body: PhoneModel = await request.json();

    if (!body.name || !body.brand || !body.basePrice) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("phone_models").upsert({
        id: body.id,
        brand: body.brand,
        name: body.name,
        tagline: body.tagline || "",
        popular: body.popular || false,
        base_price: body.basePrice,
        dimensions_mm: body.dimensionsMm,
        aspect_ratio: body.aspectRatio,
        corner_radius: body.cornerRadius,
        camera_module: body.cameraModule,
      });

      if (error) {
        console.error("Erro ao salvar modelo no Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, model: body });
  } catch (err) {
    console.error("Erro ao cadastrar modelo:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem remover modelos." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do modelo não fornecido" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("phone_models").delete().eq("id", id);
      if (error) {
        console.error("Erro ao deletar modelo do Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Erro ao remover modelo:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
