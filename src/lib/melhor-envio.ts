import { ShippingOption } from "@/types";

interface CalculateShipmentInput {
  toCep: string;
  itemsCount?: number;
  subtotal?: number;
  fromCep?: string;
}

export interface CalculateShipmentResult {
  success: boolean;
  options: ShippingOption[];
  fromCep: string;
  toCep: string;
  isFallback: boolean;
  error?: string;
}

/**
 * Normaliza e limpa CEP para 8 dígitos
 */
export function cleanCep(cep: string): string {
  return (cep || "").replace(/\D/g, "");
}

/**
 * Valida se é um CEP brasileiro válido com 8 dígitos
 */
export function isValidCep(cep: string): boolean {
  const cleaned = cleanCep(cep);
  return cleaned.length === 8 && !/^(\d)\1{7}$/.test(cleaned);
}

/**
 * Gera cotações realistas de contingência caso a API externa do Melhor Envio
 * esteja sem token ou indisponível temporariamente no ambiente de desenvolvimento
 */
function getFallbackShippingOptions(toCep: string, subtotal: number = 0): ShippingOption[] {
  const firstDigit = toCep.charAt(0);
  
  // Variação de preço e prazo baseada no primeiro dígito do CEP (Macro-regiões do Brasil)
  let pacBase = 18.90;
  let sedexBase = 27.50;
  let jadlogBase = 16.90;
  let pacDays = 6;
  let sedexDays = 2;
  let jadlogDays = 5;

  if (firstDigit === "0" || firstDigit === "1") {
    // São Paulo (origem aproximada)
    pacBase = 13.50;
    sedexBase = 19.90;
    jadlogBase = 12.90;
    pacDays = 4;
    sedexDays = 1;
    jadlogDays = 3;
  } else if (firstDigit === "2" || firstDigit === "3") {
    // RJ, ES, MG
    pacBase = 17.90;
    sedexBase = 26.90;
    jadlogBase = 15.90;
    pacDays = 5;
    sedexDays = 2;
    jadlogDays = 4;
  } else if (firstDigit === "8" || firstDigit === "9") {
    // Sul (PR, SC, RS)
    pacBase = 19.50;
    sedexBase = 29.90;
    jadlogBase = 17.50;
    pacDays = 6;
    sedexDays = 2;
    jadlogDays = 5;
  } else if (firstDigit === "4" || firstDigit === "5") {
    // Nordeste
    pacBase = 24.90;
    sedexBase = 39.90;
    jadlogBase = 22.90;
    pacDays = 8;
    sedexDays = 3;
    jadlogDays = 7;
  } else {
    // Norte e Centro-Oeste
    pacBase = 27.90;
    sedexBase = 46.50;
    jadlogBase = 25.00;
    pacDays = 10;
    sedexDays = 4;
    jadlogDays = 8;
  }

  const rawOptions: ShippingOption[] = [
    {
      id: 3,
      name: ".Package",
      company: {
        id: 2,
        name: "Jadlog",
        picture: "https://sandbox.melhorenvio.com.br/images/shipping-companies/jadlog.png",
      },
      price: jadlogBase,
      finalPrice: jadlogBase,
      deliveryTime: jadlogDays,
      deliveryRange: { min: Math.max(1, jadlogDays - 2), max: jadlogDays + 1 },
    },
    {
      id: 1,
      name: "PAC",
      company: {
        id: 1,
        name: "Correios",
        picture: "https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png",
      },
      price: pacBase,
      finalPrice: pacBase,
      deliveryTime: pacDays,
      deliveryRange: { min: Math.max(1, pacDays - 2), max: pacDays + 2 },
    },
    {
      id: 2,
      name: "SEDEX",
      company: {
        id: 1,
        name: "Correios",
        picture: "https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png",
      },
      price: sedexBase,
      finalPrice: sedexBase,
      deliveryTime: sedexDays,
      deliveryRange: { min: 1, max: sedexDays + 1 },
    },
  ];

  return applyFreeShippingRule(rawOptions, subtotal);
}

/**
 * Aplica regra de Frete Grátis da Loja (Subtotal >= R$ 149)
 * A opção mais econômica ganha R$ 0,00 (Grátis)
 */
function applyFreeShippingRule(options: ShippingOption[], subtotal: number): ShippingOption[] {
  if (subtotal < 149 || options.length === 0) {
    return options.map((opt) => ({ ...opt, finalPrice: opt.price }));
  }

  // Encontrar o menor preço
  let cheapestIndex = 0;
  let lowestPrice = Infinity;

  options.forEach((opt, idx) => {
    if (opt.price < lowestPrice) {
      lowestPrice = opt.price;
      cheapestIndex = idx;
    }
  });

  return options.map((opt, idx) => {
    if (idx === cheapestIndex) {
      return {
        ...opt,
        finalPrice: 0,
      };
    }
    return {
      ...opt,
      finalPrice: opt.price,
    };
  });
}

/**
 * Calcula frete via API do Melhor Envio ou Fallback
 */
export async function calculateMelhorEnvioShipping({
  toCep,
  itemsCount = 1,
  subtotal = 0,
  fromCep: customFromCep,
}: CalculateShipmentInput): Promise<CalculateShipmentResult> {
  const cleanedToCep = cleanCep(toCep);

  if (!isValidCep(cleanedToCep)) {
    return {
      success: false,
      options: [],
      fromCep: "",
      toCep: cleanedToCep,
      isFallback: false,
      error: "CEP de destino inválido. O CEP deve conter 8 dígitos.",
    };
  }

  const token = (process.env.MELHOR_ENVIO_TOKEN || "").trim();
  const apiUrl = (process.env.MELHOR_ENVIO_URL || "https://sandbox.melhorenvio.com.br").replace(/\/$/, "");
  const defaultFromCep = cleanCep(process.env.MELHOR_ENVIO_FROM_CEP || "01001000");
  const fromCep = customFromCep ? cleanCep(customFromCep) : defaultFromCep;
  const appContact = process.env.MELHOR_ENVIO_APP_CONTACT || "contato@snapcasebr.com";

  // Se não houver token configurado no .env, utiliza o fallback inteligente
  if (!token) {
    const fallbackOptions = getFallbackShippingOptions(cleanedToCep, subtotal);
    return {
      success: true,
      options: fallbackOptions,
      fromCep,
      toCep: cleanedToCep,
      isFallback: true,
    };
  }

  // Dimensões do pacote padrão para capinhas de smartphone
  // Capinha base: 18cm comp x 12cm larg x 4cm alt, 120g
  // Itens adicionais adicionam 1.5cm de altura e 100g de peso
  const quantity = Math.max(1, itemsCount);
  const packageHeight = Math.min(4 + Math.max(0, quantity - 1) * 1.5, 40);
  const packageWeight = Math.round(Math.max(0.12 * quantity, 0.1) * 100) / 100;
  const insuranceValue = Math.max(subtotal, 30);

  const payload = {
    from: {
      postal_code: fromCep,
    },
    to: {
      postal_code: cleanedToCep,
    },
    products: [
      {
        id: "capinha-custom",
        width: 12,
        height: packageHeight,
        length: 18,
        weight: packageWeight,
        insurance_value: insuranceValue,
        quantity: 1,
      },
    ],
    options: {
      receipt: false,
      own_hand: false,
    },
  };

  try {
    const response = await fetch(`${apiUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": `PersonalizeCases (${appContact})`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`Melhor Envio API respondeu status ${response.status}. Ativando fallback de contingência.`);
      const fallbackOptions = getFallbackShippingOptions(cleanedToCep, subtotal);
      return {
        success: true,
        options: fallbackOptions,
        fromCep,
        toCep: cleanedToCep,
        isFallback: true,
      };
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn("Resposta inesperada do Melhor Envio (não é array). Ativando fallback.");
      const fallbackOptions = getFallbackShippingOptions(cleanedToCep, subtotal);
      return {
        success: true,
        options: fallbackOptions,
        fromCep,
        toCep: cleanedToCep,
        isFallback: true,
      };
    }

    // Filtrar e formatar serviços válidos
    const validServices: ShippingOption[] = data
      .filter((item: any) => !item.error && item.price)
      .map((item: any) => {
        const rawPrice = parseFloat(item.custom_price || item.price || 0);
        const days = parseInt(item.custom_delivery_time || item.delivery_time || 0, 10);

        return {
          id: item.id,
          name: item.name,
          company: {
            id: item.company?.id,
            name: item.company?.name || "Transportadora",
            picture: item.company?.picture,
          },
          price: Number(rawPrice.toFixed(2)),
          finalPrice: Number(rawPrice.toFixed(2)),
          deliveryTime: days,
          deliveryRange: item.delivery_range
            ? {
                min: item.delivery_range.min,
                max: item.delivery_range.max,
              }
            : undefined,
        };
      });

    if (validServices.length === 0) {
      console.warn("Nenhum serviço válido retornado pelo Melhor Envio. Ativando fallback.");
      const fallbackOptions = getFallbackShippingOptions(cleanedToCep, subtotal);
      return {
        success: true,
        options: fallbackOptions,
        fromCep,
        toCep: cleanedToCep,
        isFallback: true,
      };
    }

    // Ordenar opções: mais barata primeiro
    validServices.sort((a, b) => a.price - b.price);

    const finalOptions = applyFreeShippingRule(validServices, subtotal);

    return {
      success: true,
      options: finalOptions,
      fromCep,
      toCep: cleanedToCep,
      isFallback: false,
    };
  } catch (err) {
    console.error("Erro na chamada à API do Melhor Envio:", err);
    const fallbackOptions = getFallbackShippingOptions(cleanedToCep, subtotal);
    return {
      success: true,
      options: fallbackOptions,
      fromCep,
      toCep: cleanedToCep,
      isFallback: true,
    };
  }
}
