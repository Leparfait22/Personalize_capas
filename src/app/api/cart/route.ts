import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CartItem } from "@/types";
import { uploadImageToStorage } from "@/lib/r2";

// In-memory fallback para desenvolvimento offline
const inMemoryCarts = new Map<string, CartItem[]>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json([]);
  }

  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formattedItems: CartItem[] = data.map((item: any) => ({
          id: item.id,
          model: {
            id: item.model_id,
            name: item.model_name,
            brand: "Apple",
            basePrice: Number(item.unit_price),
            dimensionsMm: { width: 75, height: 155, thickness: 8 },
            aspectRatio: 0.48,
            cornerRadius: 14,
            cameraModule: { x: 6, y: 3.5, width: 42, height: 23, shape: "rounded-square", borderRadius: 14 },
          },
          finish: {
            id: item.finish_id,
            name: item.finish_name,
            subtitle: "",
            description: "",
            priceAdd: 0,
            borderStyle: "heavy",
            features: [],
          },
          caseColor: item.case_color,
          customization: item.customization,
          previewMockupUrl: item.preview_mockup_url,
          highResPrintUrl: item.high_res_print_url,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
          createdAt: item.created_at,
        }));

        return NextResponse.json(formattedItems);
      }
    }
  } catch (err) {
    console.error("Erro ao buscar carrinho no Supabase:", err);
  }

  // Fallback em memória
  return NextResponse.json(inMemoryCarts.get(sessionId) || []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, item } = body as { sessionId: string; item: CartItem };

    if (!sessionId || !item || !item.id) {
      return NextResponse.json({ error: "Dados do item incorretos" }, { status: 400 });
    }

    // 1. Processar upload das fotos para o Cloudflare R2 se estiverem em base64
    if (item.customization?.imageUrl && item.customization.imageUrl.startsWith("data:image/")) {
      try {
        const match = item.customization.imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
          const buffer = Buffer.from(match[2], "base64");
          const fileName = `cart_orig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`;
          item.customization.imageUrl = await uploadImageToStorage(buffer, fileName, match[1]);
        }
      } catch (err) {
        console.error("Erro ao fazer upload da imagem do carrinho para R2:", err);
      }
    }

    if (item.previewMockupUrl && item.previewMockupUrl.startsWith("data:image/")) {
      try {
        const match = item.previewMockupUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
          const buffer = Buffer.from(match[2], "base64");
          const fileName = `cart_mockup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`;
          item.previewMockupUrl = await uploadImageToStorage(buffer, fileName, match[1]);
        }
      } catch (err) {
        console.error("Erro ao fazer upload do mockup do carrinho para R2:", err);
      }
    }

    // 2. Persistir no Supabase se configurado
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("cart_items").upsert({
        id: item.id,
        session_id: sessionId,
        model_id: item.model.id,
        model_name: item.model.name,
        finish_id: item.finish.id,
        finish_name: item.finish.name,
        case_color: item.caseColor,
        customization: item.customization,
        preview_mockup_url: item.previewMockupUrl,
        high_res_print_url: item.highResPrintUrl || item.previewMockupUrl,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Erro ao salvar item no Supabase cart_items:", error);
      }
    }

    // Atualizar fallback local
    const current = inMemoryCarts.get(sessionId) || [];
    const index = current.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    inMemoryCarts.set(sessionId, current);

    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error("Erro ao adicionar ao carrinho:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const itemId = searchParams.get("itemId");
  const clear = searchParams.get("clear");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId é obrigatório" }, { status: 400 });
  }

  try {
    if (isSupabaseConfigured()) {
      if (clear === "true") {
        await supabase.from("cart_items").delete().eq("session_id", sessionId);
      } else if (itemId) {
        await supabase.from("cart_items").delete().eq("id", itemId).eq("session_id", sessionId);
      }
    }
  } catch (err) {
    console.error("Erro ao remover do Supabase cart_items:", err);
  }

  // Atualizar fallback local
  if (clear === "true") {
    inMemoryCarts.delete(sessionId);
  } else if (itemId) {
    const current = inMemoryCarts.get(sessionId) || [];
    inMemoryCarts.set(sessionId, current.filter((i) => i.id !== itemId));
  }

  return NextResponse.json({ success: true });
}
