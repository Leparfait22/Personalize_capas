import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { INITIAL_PHONE_MODELS, getEnrichedCameraModule } from "@/data/catalog";
import { PhoneModel } from "@/types";
import { isServerAdmin } from "@/lib/auth-server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Lista em memória para fallback local (quando Supabase não está configurado)
let inMemoryModels: PhoneModel[] = [...INITIAL_PHONE_MODELS];

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("phone_models")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data) {
        const formatted: PhoneModel[] = data.map((item) => {
          const rawModel: PhoneModel = {
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
          };
          rawModel.cameraModule = getEnrichedCameraModule(rawModel);
          return rawModel;
        });

        return NextResponse.json(formatted, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }
    }
  } catch (err) {
    console.error("Erro ao buscar modelos do Supabase, usando catálogo local:", err);
  }

  // Fallback para catálogo em memória
  return NextResponse.json(inMemoryModels, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
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
        logger.error("ADMIN", `Falha ao salvar modelo ${body.name} (${body.id})`, {
          modelId: body.id,
          dbError: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    inMemoryModels = [
      ...inMemoryModels.filter((m) => m.id !== body.id),
      body,
    ];

    logger.info("ADMIN", `Modelo salvo/atualizado no catálogo: ${body.brand} ${body.name}`, {
      modelId: body.id,
      brand: body.brand,
      name: body.name,
      basePrice: body.basePrice,
    });

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
        logger.error("ADMIN", `Falha ao remover modelo ${id} do Supabase`, {
          modelId: id,
          dbError: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    inMemoryModels = inMemoryModels.filter((m) => m.id !== id);
    logger.info("ADMIN", `Modelo removido do catálogo: ${id}`, { modelId: id });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Erro ao remover modelo:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
