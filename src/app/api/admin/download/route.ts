import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function isAllowedExternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  // Bloquear qualquer IP local, loopback ou metadata cloud (Anti-SSRF)
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    return false;
  }

  // Lista branca de domínios confiáveis de armazenamento de imagens da loja
  const allowedSuffixes = [
    ".r2.dev",
    ".r2.cloudflarestorage.com",
    ".supabase.co",
    "images.unsplash.com",
  ];

  if (allowedSuffixes.some((suffix) => host === suffix || host.endsWith(suffix))) {
    return true;
  }

  // Domínio customizado configurado em NEXT_PUBLIC_R2_PUBLIC_URL
  const r2PublicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").trim();
  if (r2PublicUrl) {
    try {
      const configuredHost = new URL(r2PublicUrl).hostname.toLowerCase();
      if (configuredHost && host === configuredHost) {
        return true;
      }
    } catch {
      // ignora URL inválida na env
    }
  }

  return false;
}

function sanitizeFileName(rawName: string, extension: string = "png"): string {
  const firstLine = (rawName || "ARTE_SNAPCASE").split(/[\r\n]/)[0];
  const cleanBase = firstLine
    .replace(/\.(png|jpe?g|webp)$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  const cleanExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  return `${cleanBase || "ARTE_SNAPCASE"}.${cleanExt}`;
}

function extensionFromMime(mimeType: string): string {
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

export async function GET(request: Request) {
  // 🔒 1. Apenas administradores autenticados podem baixar artes/fotos de pedidos
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem baixar arquivos de pedidos." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = (searchParams.get("url") || "").trim();
  const rawFilename = (searchParams.get("filename") || "ARTE_SNAPCASE").trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "URL da imagem não informada." }, { status: 400 });
  }

  try {
    // Caso 1: Arquivo local em /uploads/... (prevenindo Path Traversal com path.basename)
    if (rawUrl.startsWith("/uploads/")) {
      const safeFile = path.basename(rawUrl);
      const localPath = path.join(process.cwd(), "public", "uploads", safeFile);

      if (!fs.existsSync(localPath)) {
        return NextResponse.json({ error: "Arquivo local não encontrado." }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(localPath);
      const ext = path.extname(safeFile).replace(".", "") || "png";
      const finalName = sanitizeFileName(rawFilename, ext);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": `image/${ext === "jpg" ? "jpeg" : ext}`,
          "Content-Disposition": `attachment; filename="${finalName}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store",
        },
      });
    }

    // Caso 2: URL HTTPS externa (Cloudflare R2 / Unsplash / Supabase)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Formato de URL inválido." }, { status: 400 });
    }

    if (parsedUrl.protocol !== "https:" || !isAllowedExternalHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Domínio de origem não autorizado para download." },
        { status: 403 }
      );
    }

    const upstreamRes = await fetch(parsedUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Não foi possível obter a imagem na origem (HTTP ${upstreamRes.status}).` },
        { status: 502 }
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/png";
    if (!contentType.toLowerCase().startsWith("image/") && !contentType.toLowerCase().includes("octet-stream")) {
      return NextResponse.json(
        { error: "O arquivo solicitado não é uma imagem válida." },
        { status: 400 }
      );
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const ext = extensionFromMime(contentType);
    const finalName = sanitizeFileName(rawFilename, ext);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType.startsWith("image/") ? contentType : "image/png",
        "Content-Disposition": `attachment; filename="${finalName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    console.error("Erro ao processar download seguro de arte:", err);
    return NextResponse.json(
      { error: "Erro interno ao baixar imagem." },
      { status: 500 }
    );
  }
}

