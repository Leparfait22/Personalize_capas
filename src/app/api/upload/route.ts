import { NextResponse } from "next/server";
import { uploadImageToStorage } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const contentTypeHeader = request.headers.get("content-type") || "";

    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType = "image/png";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || "image/png";
      const ext = mimeType.split("/")[1] || "png";
      fileName = `custom_case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    } else {
      // Requisicao JSON com base64
      const body = await request.json();
      const { imageBase64, filename } = body;

      if (!imageBase64) {
        return NextResponse.json({ error: "Imagens base64 ausente" }, { status: 400 });
      }

      // Remover prefixo de DataURL se houver (ex: data:image/png;base64,...)
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        const base64Data = matches[2];
        fileBuffer = Buffer.from(base64Data, "base64");
      } else {
        fileBuffer = Buffer.from(imageBase64, "base64");
      }

      const ext = mimeType.split("/")[1] || "png";
      fileName = filename || `custom_case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    }

    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase()) && !mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Formato de arquivo não suportado. Envie apenas imagens (JPG, PNG, WEBP)." }, { status: 400 });
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. O limite máximo é 15MB." }, { status: 400 });
    }

    const publicUrl = await uploadImageToStorage(fileBuffer, fileName, mimeType);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (err) {
    console.error("Erro no processamento de upload:", err);
    return NextResponse.json(
      { error: "Falha ao processar e salvar imagem" },
      { status: 500 }
    );
  }
}
