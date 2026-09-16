import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "snapcase-images";
const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

export const isR2Configured = () => {
  return Boolean(accountId && accessKeyId && secretAccessKey);
};

const s3Client = isR2Configured()
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

/**
 * Uploads a file buffer or base64 data to Cloudflare R2 (or saves locally to /public/uploads as fallback)
 */
export async function uploadImageToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = "image/png"
): Promise<string> {
  // Se o R2 estiver configurado, faz o upload para o Cloudflare R2
  if (s3Client && isR2Configured()) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      });

      await s3Client.send(command);

      if (publicUrl) {
        const cleanDomain = publicUrl.replace(/\/$/, "");
        return `${cleanDomain}/${fileName}`;
      }
      return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${fileName}`;
    } catch (err) {
      console.error("Erro ao fazer upload para Cloudflare R2. Utilizando fallback local:", err);
    }
  }

  // Fallback: Salvar localmente em public/uploads para desenvolvimento sem R2
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${fileName}`;
  } catch (localErr) {
    console.error("Erro ao salvar imagem no disco local:", localErr);
    throw new Error("Falha no upload da imagem");
  }
}
