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
