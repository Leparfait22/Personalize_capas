import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ImageQualityRating } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Avalia a qualidade de impressão baseada nas dimensões em pixels da imagem
 * Calculando DPI estimado para uma capinha de aproximadamente 7.5cm x 15.5cm (3" x 6.1")
 */
export function evaluateImageQuality(width: number, height: number): ImageQualityRating {
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  // Estimativa aproximada de DPI considerando altura de 6 polegadas (~15cm)
  const estimatedDpi = Math.round(maxDimension / 6.0);

  if (minDimension >= 1200 && maxDimension >= 2000) {
    return {
      dpi: Math.max(300, estimatedDpi),
      score: "excellent",
      label: "Qualidade Ultra-HD (Excelente)",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      recommendation: "Foto com resolução perfeita para impressão fotográfica e detalhes nítidos.",
    };
  } else if (minDimension >= 800 && maxDimension >= 1200) {
    return {
      dpi: Math.max(200, estimatedDpi),
      score: "good",
      label: "Qualidade Boa para Impressão",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      recommendation: "A imagem terá boa nitidez na capa final.",
    };
  } else if (minDimension >= 500 && maxDimension >= 800) {
    return {
      dpi: Math.max(150, estimatedDpi),
      score: "fair",
      label: "Qualidade Moderada",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      recommendation: "Recomendamos evitar zoom excessivo para não perder nitidez.",
    };
  } else {
    return {
      dpi: estimatedDpi,
      score: "low",
      label: "Baixa Resolução",
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      recommendation: "A imagem pode ficar pixelada ou com ruído na impressão. Se possível, use uma foto original.",
    };
  }
}

/**
 * Redimensiona e comprime uma imagem no lado do cliente para otimizar performance,
 * evitar limites de memória e não estourar a cota de 5MB do localStorage.
 */
export function compressAndResizeImage(
  file: File,
  maxDimension = 2000
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Aceita tipos de imagem padrão e HEIC (para fallback)
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic")) {
      reject(new Error("O arquivo selecionado não é uma imagem válida."));
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(imageUrl);

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Calcular novas dimensões mantendo o aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível obter o contexto do canvas."));
        return;
      }

      // Desenhar a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Converter para JPEG com 85% de qualidade (balanço ideal entre peso e nitidez)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({
          dataUrl: compressedDataUrl,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(imageUrl);
      reject(err);
    };

    img.src = imageUrl;
  });
}

