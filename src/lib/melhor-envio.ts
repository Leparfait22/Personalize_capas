import { Order, ShippingOption } from "@/types";

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

export interface MelhorEnvioConfig {
  environment: "sandbox" | "production";
  apiUrl: string;
  token: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  defaultFromCep: string;
  appContact: string;
  isSandbox: boolean;
  fromName: string;
  fromPhone: string;
  fromDocument: string;
  fromAddress: string;
  fromNumber: string;
  fromComplement: string;
  fromDistrict: string;
  fromCity: string;
  fromState: string;
}

/**
 * Retorna a configuração ativa do Melhor Envio baseada no ambiente (.env)
 * Suporta alternar entre 'sandbox' (testes) e 'production' (conta do dono da loja)
 */
export function getMelhorEnvioConfig(): MelhorEnvioConfig {
  const envSetting = (process.env.MELHOR_ENVIO_ENV || "").trim().toLowerCase();
  const directUrl = (process.env.MELHOR_ENVIO_URL || "").trim();

  // Ativa produção se explícito no MELHOR_ENVIO_ENV ou se a URL direta for www.melhorenvio.com.br
  const isProduction =
    envSetting === "production" ||
    envSetting === "prod" ||
    (!envSetting && directUrl.includes("www.melhorenvio.com.br"));

  const environment: "sandbox" | "production" = isProduction ? "production" : "sandbox";
  const defaultBaseUrl = isProduction
    ? "https://www.melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";

  const apiUrl = (
    isProduction
      ? process.env.MELHOR_ENVIO_PROD_URL || directUrl || defaultBaseUrl
      : process.env.MELHOR_ENVIO_SANDBOX_URL || directUrl || defaultBaseUrl
  ).replace(/\/$/, "");

  const token = (
    isProduction
      ? process.env.MELHOR_ENVIO_PROD_TOKEN || process.env.MELHOR_ENVIO_TOKEN || ""
      : process.env.MELHOR_ENVIO_SANDBOX_TOKEN || process.env.MELHOR_ENVIO_TOKEN || ""
  ).trim();

  const clientId = (
    isProduction
      ? process.env.MELHOR_ENVIO_PROD_CLIENT_ID || process.env.MELHOR_ENVIO_CLIENT_ID || ""
      : process.env.MELHOR_ENVIO_SANDBOX_CLIENT_ID || process.env.MELHOR_ENVIO_CLIENT_ID || ""
  ).trim();

  const clientSecret = (
    isProduction
      ? process.env.MELHOR_ENVIO_PROD_CLIENT_SECRET || process.env.MELHOR_ENVIO_CLIENT_SECRET || ""
      : process.env.MELHOR_ENVIO_SANDBOX_CLIENT_SECRET || process.env.MELHOR_ENVIO_CLIENT_SECRET || ""
  ).trim();

  const redirectUri = (process.env.MELHOR_ENVIO_REDIRECT_URI || "").trim();

  const defaultFromCep = cleanCep(
    (isProduction
      ? process.env.MELHOR_ENVIO_PROD_FROM_CEP || process.env.MELHOR_ENVIO_FROM_CEP
      : process.env.MELHOR_ENVIO_SANDBOX_FROM_CEP || process.env.MELHOR_ENVIO_FROM_CEP) || "01001000"
  );

  const appContact =
    (isProduction
      ? process.env.MELHOR_ENVIO_PROD_APP_CONTACT || process.env.MELHOR_ENVIO_APP_CONTACT
      : process.env.MELHOR_ENVIO_APP_CONTACT) || "contato@snapcasebr.com";

  return {
    environment,
    apiUrl,
    token,
    clientId,
    clientSecret,
    redirectUri,
    defaultFromCep,
    appContact,
    isSandbox: !isProduction && apiUrl.includes("sandbox"),
    fromName: process.env.MELHOR_ENVIO_FROM_NAME || "Personalize Cases Store",
    fromPhone: (process.env.MELHOR_ENVIO_FROM_PHONE || "11988887777").replace(/\D/g, ""),
    fromDocument: (process.env.MELHOR_ENVIO_FROM_DOCUMENT || "29410948000109").replace(/\D/g, ""),
    fromAddress: process.env.MELHOR_ENVIO_FROM_ADDRESS || "Avenida Paulista",
    fromNumber: process.env.MELHOR_ENVIO_FROM_NUMBER || "1000",
    fromComplement: process.env.MELHOR_ENVIO_FROM_COMPLEMENT || "Sala 101",
    fromDistrict: process.env.MELHOR_ENVIO_FROM_DISTRICT || "Bela Vista",
    fromCity: process.env.MELHOR_ENVIO_FROM_CITY || "São Paulo",
    fromState: process.env.MELHOR_ENVIO_FROM_STATE || "SP",
  };
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

  const config = getMelhorEnvioConfig();
  const token = config.token;
  const apiUrl = config.apiUrl;
  const defaultFromCep = config.defaultFromCep;
  const fromCep = customFromCep ? cleanCep(customFromCep) : defaultFromCep;
  const appContact = config.appContact;

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

export interface GenerateLabelResult {
  success: boolean;
  shipmentId: string;
  trackingCode: string;
  labelUrl: string;
  protocol?: string;
  carrierName: string;
  serviceName: string;
  price: number;
  isSandbox: boolean;
  error?: string;
}

/**
 * Realiza o ciclo completo de compra, geração e emissão da etiqueta no Melhor Envio
 * (Consome do saldo da carteira de testes R$ 10.000 no Sandbox ou saldo real em Produção)
 */
export async function generateMelhorEnvioLabel(order: Order): Promise<GenerateLabelResult> {
  const config = getMelhorEnvioConfig();
  const token = config.token;
  const apiUrl = config.apiUrl;
  const defaultFromCep = config.defaultFromCep;
  const appContact = config.appContact;
  const isSandbox = config.isSandbox;

  if (!token) {
    throw new Error("Token do Melhor Envio não configurado.");
  }

  // Identificação do serviço (No Sandbox, Jadlog .Package=3 e .Com=4 têm suporte a impressão)
  let serviceId = 3; // Jadlog .Package por padrão
  if (order.shippingMethod?.id) {
    const parsedId = Number(order.shippingMethod.id);
    if (!isNaN(parsedId)) {
      serviceId = parsedId;
    }
  }

  const cleanPhone = (order.customer.whatsapp || "11988887777").replace(/\D/g, "");
  const cleanCpf = (order.customer.cpf || "34218904822").replace(/\D/g, "");
  const cleanToCep = cleanCep(order.shippingAddress.zipCode);

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const packageHeight = Math.min(4 + Math.max(0, totalQuantity - 1) * 1.5, 40);
  const packageWeight = Math.round(Math.max(0.12 * totalQuantity, 0.1) * 100) / 100;
  const insuranceValue = Math.max(order.subtotal, 30);

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": `PersonalizeCases (${appContact})`,
  };

  // 1. Montagem do Carrinho do Melhor Envio
  const cartPayload = {
    service: serviceId,
    from: {
      name: config.fromName,
      phone: config.fromPhone,
      email: appContact,
      document: config.fromDocument,
      company_document: "",
      state_register: "",
      address: config.fromAddress,
      complement: config.fromComplement,
      number: config.fromNumber,
      district: config.fromDistrict,
      city: config.fromCity,
      state_abbr: config.fromState,
      country_id: "BR",
      postal_code: defaultFromCep,
      note: "",
    },
    to: {
      name: order.customer.name,
      phone: cleanPhone.length >= 10 ? cleanPhone : "11999999999",
      email: order.customer.email,
      document: cleanCpf.length === 11 ? cleanCpf : "34218904822",
      company_document: "",
      state_register: "",
      address: order.shippingAddress.street || "Rua do Cliente",
      complement: order.shippingAddress.complement || "",
      number: order.shippingAddress.number || "S/N",
      district: order.shippingAddress.neighborhood || "Centro",
      city: order.shippingAddress.city || "São Paulo",
      state_abbr: order.shippingAddress.state || "SP",
      country_id: "BR",
      postal_code: cleanToCep,
      note: `Pedido ${order.orderNumber}`,
    },
    products: order.items.map((item) => ({
      name: `Capinha ${item.model.name} (${item.finish.name})`,
      quantity: item.quantity,
      unitary_value: item.unitPrice,
    })),
    volumes: [
      {
        height: packageHeight,
        width: 12,
        length: 18,
        weight: packageWeight,
      },
    ],
    options: {
      insurance_value: insuranceValue,
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: true,
    },
  };

  // Passo 1: Inserir Envio no Carrinho
  const cartRes = await fetch(`${apiUrl}/api/v2/me/cart`, {
    method: "POST",
    headers,
    body: JSON.stringify(cartPayload),
  });

  const cartData = await cartRes.json();
  if (!cartRes.ok || !cartData.id) {
    console.error("Erro ao adicionar ao carrinho do Melhor Envio:", cartData);
    throw new Error(cartData.message || cartData.error || "Erro ao adicionar remessa ao carrinho.");
  }

  const shipmentId = cartData.id;
  const protocol = cartData.protocol || "";
  const carrierName = cartData.service?.company?.name || order.shippingMethod?.company || "Transportadora";
  const serviceName = cartData.service?.name || order.shippingMethod?.name || "Frete";
  const price = parseFloat(cartData.price || "0");

  // Passo 2: Checkout (Pagar Etiqueta com Saldo da Carteira de Testes R$ 10.000)
  const checkoutRes = await fetch(`${apiUrl}/api/v2/me/shipment/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({ orders: [shipmentId] }),
  });

  const checkoutData = await checkoutRes.json();
  if (!checkoutRes.ok) {
    console.warn("Aviso no checkout do Melhor Envio:", checkoutData);
  }

  // Passo 3: Solicitar Geração da Etiqueta
  try {
    await fetch(`${apiUrl}/api/v2/me/shipment/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ orders: [shipmentId] }),
    });
  } catch (genErr) {
    console.warn("Aviso ao solicitar generate da etiqueta:", genErr);
  }

  // Passo 4: Obter URL de Impressão Pública da Etiqueta
  let labelUrl = "";
  try {
    const printRes = await fetch(`${apiUrl}/api/v2/me/shipment/print`, {
      method: "POST",
      headers,
      body: JSON.stringify({ mode: "public", orders: [shipmentId] }),
    });

    if (printRes.ok) {
      const printData = await printRes.json();
      labelUrl = printData.url || "";
    }
  } catch (printErr) {
    console.warn("Aviso ao buscar URL de impressão:", printErr);
  }

  // Fallback para URL direta de impressão do Melhor Envio caso a resposta não venha com link
  if (!labelUrl) {
    labelUrl = `${apiUrl}/api/v2/me/shipment/print/${shipmentId}`;
  }

  // Passo 5: Obter Detalhes e Código de Rastreamento
  let trackingCode = protocol;
  try {
    const orderDetailsRes = await fetch(`${apiUrl}/api/v2/me/orders/${shipmentId}`, {
      method: "GET",
      headers,
    });

    if (orderDetailsRes.ok) {
      const orderDetails = await orderDetailsRes.json();
      if (orderDetails.tracking) {
        trackingCode = orderDetails.tracking;
      } else if (orderDetails.protocol) {
        trackingCode = orderDetails.protocol;
      }
    }
  } catch (trackErr) {
    console.warn("Aviso ao buscar detalhes de rastreio:", trackErr);
  }

  if (!trackingCode) {
    trackingCode = `ME-${shipmentId.slice(0, 8).toUpperCase()}`;
  }

  return {
    success: true,
    shipmentId,
    trackingCode,
    labelUrl,
    protocol,
    carrierName,
    serviceName,
    price,
    isSandbox,
  };
}

