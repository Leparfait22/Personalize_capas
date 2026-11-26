import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { INITIAL_GALLERY_ARTS } from "@/data/catalog";
import { GalleryArtItem } from "@/types";
import { isServerAdmin } from "@/lib/auth-server";
import { uploadImageToStorage } from "@/lib/r2";
import { sanitizeInput } from "@/lib/utils";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GALLERY_BADGE_MARKER = "gallery_art";
const ALLOWED_BASE64_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_GALLERY_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB

let inMemoryGallery: GalleryArtItem[] = [...INITIAL_GALLERY_ARTS];
let hasSeededInitialGallery = false;

async function validateAndProcessGalleryImageUrl(
  rawUrl: string
): Promise<{ valid: boolean; url?: string; error?: string }> {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) {
    return { valid: false, error: "URL da imagem é obrigatória." };
  }

  // 1. Upload Base64: aceita apenas PNG, JPEG, JPG ou WEBP (bloqueia SVG com scripts e arquivos > 15MB)
  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/);
    if (!match) {
      return { valid: false, error: "Formato de imagem Base64 inválido." };
    }
    const mimeType = match[1].toLowerCase();
    if (!ALLOWED_BASE64_MIMES.has(mimeType)) {
      return {
        valid: false,
        error: "Tipo de imagem não permitido. Use apenas PNG, JPG ou WEBP.",
      };
    }
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length === 0 || buffer.length > MAX_GALLERY_IMAGE_BYTES) {
      return {
        valid: false,
        error: "A imagem excede o limite máximo permitido de 15MB.",
      };
    }
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : mimeType.includes("webp") ? "webp" : "png";
    const fileName = `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const uploadedUrl = await uploadImageToStorage(buffer, fileName, mimeType);
    return { valid: true, url: uploadedUrl };
  }

  // 2. Caminho local seguro em /uploads/
  if (trimmed.startsWith("/uploads/")) {
    if (trimmed.includes("..") || /[<>"']/.test(trimmed)) {
      return { valid: false, error: "Caminho de imagem local inválido." };
    }
    return { valid: true, url: trimmed };
  }

  // 3. URL externa: permite exclusivamente protocolo HTTPS (bloqueia javascript:, data:text/html, file:, http:)
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Apenas URLs de imagem seguras (HTTPS) são permitidas." };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: "URL da imagem inválida." };
  }
}

function mapRowToGalleryItem(row: any): GalleryArtItem {
  return {
    id: row.id,
    name: row.name,
    category: row.subtitle || "Geral",
    imageUrl: row.description,
    thumbUrl: Array.isArray(row.features) && row.features[0] ? row.features[0] : row.description,
    inBanner: Boolean(row.popular_badge),
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("case_finishes")
        .select("*")
        .eq("badge", GALLERY_BADGE_MARKER)
        .order("created_at", { ascending: true });

      if (!error && data) {
        // Se ainda não houver nenhuma arte da galeria no banco e for a primeira inicialização, popula as 5 iniciais
        if (data.length === 0 && !hasSeededInitialGallery) {
          hasSeededInitialGallery = true;
          const seedRows = INITIAL_GALLERY_ARTS.map((item) => ({
            id: item.id,
            name: item.name,
            subtitle: item.category,
            description: item.imageUrl,
            price_add: 0,
            badge: GALLERY_BADGE_MARKER,
            popular_badge: item.inBanner ?? true,
            border_style: "heavy",
            features: [item.thumbUrl || item.imageUrl],
          }));

          const { error: seedErr } = await supabase
            .from("case_finishes")
            .upsert(seedRows, { onConflict: "id" });

          if (!seedErr) {
            return NextResponse.json(INITIAL_GALLERY_ARTS, {
              headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
            });
          }
        }

        const formatted = data.map(mapRowToGalleryItem);
        return NextResponse.json(formatted, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      }
    }
  } catch (err) {
    console.error("Erro ao carregar galeria de artes do Supabase:", err);
  }

  return NextResponse.json(inMemoryGallery, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(request: Request) {
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem gerenciar a galeria de artes." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const rawName = sanitizeInput(body.name || "");
    const rawCategory = sanitizeInput(body.category || "Geral");
    const rawImageUrl = String(body.imageUrl || "").trim();

    if (!rawName || !rawImageUrl) {
      return NextResponse.json(
        { error: "Nome da arte e imagem são obrigatórios." },
        { status: 400 }
      );
    }

    const processedImg = await validateAndProcessGalleryImageUrl(rawImageUrl);
    if (!processedImg.valid || !processedImg.url) {
      return NextResponse.json(
        { error: processedImg.error || "Imagem inválida." },
        { status: 400 }
      );
    }
    const finalImageUrl = processedImg.url;

    const id =
      body.id ||
      `gallery-${rawCategory.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`;

    const newItem: GalleryArtItem = {
      id,
      name: rawName,
      category: rawCategory,
      imageUrl: finalImageUrl,
      thumbUrl: body.thumbUrl || finalImageUrl,
      inBanner: Boolean(body.inBanner),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("case_finishes").upsert({
        id: newItem.id,
        name: newItem.name,
        subtitle: newItem.category,
        description: newItem.imageUrl,
        price_add: 0,
        badge: GALLERY_BADGE_MARKER,
        popular_badge: Boolean(newItem.inBanner),
        border_style: "heavy",
        features: [newItem.thumbUrl || newItem.imageUrl],
      });

      if (error) {
        logger.error("ADMIN", `Falha ao salvar arte na galeria: ${newItem.name}`, {
          artId: newItem.id,
          dbError: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    inMemoryGallery = [
      ...inMemoryGallery.filter((item) => item.id !== newItem.id),
      newItem,
    ];

    logger.info("ADMIN", `Arte adicionada à galeria: ${newItem.name} (${newItem.category})`, {
      artId: newItem.id,
      category: newItem.category,
      imageUrl: newItem.imageUrl,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: any) {
    logger.error("ADMIN", "Erro interno ao cadastrar arte na galeria", { error: err });
    return NextResponse.json(
      { error: "Erro interno ao salvar arte na galeria." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem editar a galeria." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "ID da arte é obrigatório." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = sanitizeInput(body.name);
    if (body.category !== undefined) updates.subtitle = sanitizeInput(body.category);
    if (body.inBanner !== undefined) updates.popular_badge = Boolean(body.inBanner);

    if (body.imageUrl !== undefined) {
      const processedImg = await validateAndProcessGalleryImageUrl(String(body.imageUrl));
      if (!processedImg.valid || !processedImg.url) {
        return NextResponse.json(
          { error: processedImg.error || "Imagem inválida." },
          { status: 400 }
        );
      }
      updates.description = processedImg.url;
      updates.features = [processedImg.url];
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("case_finishes")
        .update(updates)
        .eq("id", id)
        .eq("badge", GALLERY_BADGE_MARKER)
        .select("*")
        .maybeSingle();

      if (error) {
        logger.error("ADMIN", `Falha ao atualizar arte ${id}`, { dbError: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (data) {
        const updatedItem = mapRowToGalleryItem(data);
        inMemoryGallery = inMemoryGallery.map((item) =>
          item.id === id ? updatedItem : item
        );
        logger.info("ADMIN", `Arte atualizada na galeria/banner: ${updatedItem.name}`, {
          artId: id,
          inBanner: updatedItem.inBanner,
        });
        return NextResponse.json({ success: true, item: updatedItem });
      }
    }

    inMemoryGallery = inMemoryGallery.map((item) =>
      item.id === id
        ? {
            ...item,
            ...(body.name !== undefined ? { name: sanitizeInput(body.name) } : {}),
            ...(body.category !== undefined ? { category: sanitizeInput(body.category) } : {}),
            ...(body.inBanner !== undefined ? { inBanner: Boolean(body.inBanner) } : {}),
            ...(updates.description ? { imageUrl: updates.description, thumbUrl: updates.description } : {}),
          }
        : item
    );

    const found = inMemoryGallery.find((item) => item.id === id);
    return NextResponse.json({ success: true, item: found });
  } catch (err: any) {
    logger.error("ADMIN", "Erro interno ao atualizar arte da galeria", { error: err });
    return NextResponse.json({ error: "Erro ao atualizar arte." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem remover artes da galeria." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da arte não fornecido." }, { status: 400 });
    }

    hasSeededInitialGallery = true;

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("case_finishes")
        .delete()
        .eq("id", id)
        .eq("badge", GALLERY_BADGE_MARKER);

      if (error) {
        logger.error("ADMIN", `Falha ao remover arte ${id} da galeria`, {
          artId: id,
          dbError: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    inMemoryGallery = inMemoryGallery.filter((item) => item.id !== id);
    logger.info("ADMIN", `Arte removida da galeria: ${id}`, { artId: id });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    logger.error("ADMIN", "Erro interno ao remover arte da galeria", { error: err });
    return NextResponse.json(
      { error: "Erro interno ao remover arte da galeria." },
      { status: 500 }
    );
  }
}

