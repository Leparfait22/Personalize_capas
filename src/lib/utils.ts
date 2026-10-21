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

/**
 * Sanitiza strings para prevenir ataques de Cross-Site Scripting (XSS)
 * Remove tags HTML, scripts inline e comandos perigosos mantendo a digitação de espaços e acentos fluida.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/[<>]/g, "");
}

/**
 * Remove qualquer formatação HTML para exibição segura sem alterar o texto original
 */
export function escapeHTML(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================================
// MÁSCARAS DE FORMATAÇÃO DE CAMPOS
// ============================================================================

/** Máscara de CPF: 000.000.000-00 */
export function formatCPFMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Máscara de Telefone / WhatsApp: (00) 90000-0000 */
export function formatPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Máscara de CEP: 00000-000 */
export function formatCEPMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Máscara de Cartão de Crédito: 0000 0000 0000 0000 */
export function formatCardMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Máscara de Validade de Cartão: MM/AA */
export function formatExpiryMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// ============================================================================
// VALIDAÇÕES REAIS DE DADOS (CPF, WHATSAPP, E-MAIL)
// ============================================================================

/**
 * Validação real de CPF (Algoritmo de dígitos verificadores oficiais da Receita Federal)
 */
export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação de WhatsApp / Telefone do Brasil (DDD válido + 10 ou 11 dígitos)
 */
export function isValidWhatsApp(phone: string): boolean {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 10 || clean.length > 11) return false;
  const ddd = parseInt(clean.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  if (clean.length === 11 && clean.charAt(2) !== "9") return false;
  return true;
}

/**
 * Validação de Formato de E-mail
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Detecta a bandeira de cartão pelo número
 */
export function detectCardBrand(cardNumber: string): {
  id: string;
  name: string;
  color: string;
} {
  const clean = cardNumber.replace(/\D/g, "");

  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|5090|6277|6362|6363|6500|6516)/.test(
      clean
    )
  ) {
    return { id: "elo", name: "Elo", color: "bg-blue-600 text-white" };
  }

  if (/^(606282|3841)/.test(clean)) {
    return { id: "hipercard", name: "Hipercard", color: "bg-red-600 text-white" };
  }

  if (/^4/.test(clean)) {
    return { id: "visa", name: "Visa", color: "bg-indigo-600 text-white" };
  }

  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean)) {
    return { id: "master", name: "Mastercard", color: "bg-amber-600 text-white" };
  }

  if (/^3[47]/.test(clean)) {
    return { id: "amex", name: "Amex", color: "bg-cyan-700 text-white" };
  }

  return { id: "generic", name: "Cartão", color: "bg-zinc-800 text-white" };
}


