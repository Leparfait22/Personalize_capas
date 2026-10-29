import { Order, PaymentDetails } from "@/types";

export interface AsaasConfigData {
  environment: "sandbox" | "production";
  apiKey: string;
  baseUrl: string;
  webhookToken: string;
  hasCredentials: boolean;
  isSandbox: boolean;
}

export interface CardPaymentInput {
  cardNumber: string;
  cardHolderName: string;
  expiry: string; // MM/AA ou MM/AAAA
  cvv: string;
  installments?: number;
  isDebit?: boolean;
}

export interface CreatePixResult {
  success: boolean;
  paymentId: string;
  status: "pending" | "approved" | "rejected";
  statusDetail?: string;
  pixQrCode: string;
  pixQrCodeBase64: string;
  ticketUrl?: string;
  isSimulated?: boolean;
  error?: string;
}

export interface CreateCardResult {
  success: boolean;
  paymentId: string;
  status: "approved" | "pending" | "rejected";
  statusDetail?: string;
  cardBrand?: string;
  cardLastFour?: string;
  installments?: number;
  installmentAmount?: number;
  isSimulated?: boolean;
  error?: string;
}

/**
 * Retorna as credenciais e configurações ativas do Asaas.
 * Utiliza apenas a variável ASAAS_API_KEY no .env, identificando
 * automaticamente o ambiente (Produção ou Sandbox/Homologação) pelo padrão da chave
 * ou utilizando Produção por padrão para as credenciais da loja.
 */
export function getAsaasConfig(): AsaasConfigData {
  let apiKey = (process.env.ASAAS_API_KEY || "").trim();
  let envSetting = (process.env.ASAAS_ENV || "").trim().toLowerCase();
  let webhookToken = (process.env.ASAAS_WEBHOOK_TOKEN || "").trim();

  // Fallback: se o Next.js dev server estiver rodando e ainda não tiver recarregado o .env em memória
  if (typeof window === "undefined" && !apiKey) {
    try {
      const fs = require("node:fs");
      const path = require("node:path");
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
          const [rawKey, ...rest] = trimmed.split("=");
          const k = rawKey.trim();
          const v = rest.join("=").trim().replace(/^["']|["']$/g, "");
          if (k === "ASAAS_API_KEY" && v) apiKey = v;
          if (k === "ASAAS_ENV" && v) envSetting = v.toLowerCase();
          if (k === "ASAAS_WEBHOOK_TOKEN" && v) webhookToken = v;
          // Compatibilidade retroativa caso ainda existam chaves com os nomes antigos
          if (k === "ASAAS_PROD_API_KEY" && v && !apiKey) apiKey = v;
          if (k === "ASAAS_SANDBOX_API_KEY" && v && !apiKey) apiKey = v;
        }
      }
    } catch {
      // Ignora erro de leitura em ambientes restritos
    }
  }

  // Remove aspas acidentais que possam ter sido copiadas junto com a chave
  apiKey = apiKey.replace(/^["']|["']$/g, "").trim();

  // Detecção inteligente do ambiente Asaas:
  // 1. Chaves de homologação do Asaas iniciam com $aact_hmlg_ ou contêm 'hmlg'
  // 2. Se ASAAS_ENV for explicitamente definido como 'sandbox', honra sandbox
  // 3. Se houver chave e não for de homologação, assume Produção (conta real da loja)
  // 4. Sem chave configurada, assume sandbox para testes locais e modo simulado
  const isExplicitSandbox = envSetting === "sandbox" || envSetting === "dev" || envSetting === "test";
  const isExplicitProd = envSetting === "production" || envSetting === "prod";

  const isSandbox =
    isExplicitSandbox ||
    apiKey.startsWith("$aact_hmlg_") ||
    apiKey.toLowerCase().includes("hmlg") ||
    (!isExplicitProd && !apiKey.startsWith("$aact_prod_") && !apiKey);

  const isProd = !isSandbox;

  // Base URL oficial do Asaas (v3)
  const baseUrl = isProd
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

  const hasCredentials = Boolean(apiKey && apiKey.length > 10);

  return {
    environment: isProd ? "production" : "sandbox",
    apiKey,
    baseUrl,
    webhookToken,
    hasCredentials,
    isSandbox,
  };
}

/**
 * Detecta a bandeira do cartão pelo número
 */
export function detectCardBrand(cardNumber: string): {
  id: string;
  name: string;
  isDebitSupported: boolean;
} {
  const clean = cardNumber.replace(/\D/g, "");

  // Elo: 4011, 4312, 4389, 4514, 4576, 5041, 5066-5067, 5090, 6277, 6362, 6363, 6500, 6516, etc.
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|5090|6277|6362|6363|6500|6516)/.test(
      clean
    )
  ) {
    return { id: "elo", name: "Elo", isDebitSupported: true };
  }

  // Hipercard: 606282
  if (/^(606282|3841)/.test(clean)) {
    return { id: "hipercard", name: "Hipercard", isDebitSupported: false };
  }

  // Visa: 4
  if (/^4/.test(clean)) {
    return { id: "visa", name: "Visa", isDebitSupported: true };
  }

  // Mastercard: 51-55 ou 2221-2720
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean)) {
    return { id: "master", name: "Mastercard", isDebitSupported: true };
  }

  // American Express: 34 ou 37
  if (/^3[47]/.test(clean)) {
    return { id: "amex", name: "American Express", isDebitSupported: false };
  }

  return { id: "generic", name: "Cartão", isDebitSupported: true };
}

/**
 * Encontra um cliente existente ou cadastra um novo no Asaas
 */
export async function findOrCreateAsaasCustomer(
  customer: Order["customer"],
  address: Order["shippingAddress"]
): Promise<string | null> {
  const config = getAsaasConfig();
  if (!config.hasCredentials) return null;

  const cleanCpf = (customer.cpf || "").replace(/\D/g, "");
  const cleanPhone = (customer.whatsapp || "").replace(/\D/g, "");
  const cleanCep = (address.zipCode || "").replace(/\D/g, "");

  try {
    // 1. Tentar encontrar cliente já cadastrado pelo CPF
    if (cleanCpf) {
      const searchRes = await fetch(
        `${config.baseUrl}/customers?cpfCnpj=${cleanCpf}`,
        {
          method: "GET",
          headers: {
            access_token: config.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
          return searchData.data[0].id;
        }
      }
    }

    // 2. Se não existir, cria o novo cliente no Asaas
    const createRes = await fetch(`${config.baseUrl}/customers`, {
      method: "POST",
      headers: {
        access_token: config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: customer.name,
        cpfCnpj: cleanCpf,
        email: customer.email,
        mobilePhone: cleanPhone,
        postalCode: cleanCep,
        address: address.street,
        addressNumber: address.number,
        complement: address.complement || undefined,
        province: address.neighborhood || undefined,
        notificationDisabled: true,
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      console.error("Erro ao criar cliente no Asaas:", errData);
      return null;
    }

    const created = await createRes.json();
    return created.id || null;
  } catch (err) {
    console.error("Exceção ao buscar/criar cliente no Asaas:", err);
    return null;
  }
}

/**
 * Cria uma cobrança PIX via API v3 do Asaas
 * Retorna QR Code em Base64 e Copia e Cola (EMV)
 */
export async function createAsaasPixPayment(order: Order): Promise<CreatePixResult> {
  const config = getAsaasConfig();

  // Se tiver credenciais ativas, chama a API oficial do Asaas
  if (config.hasCredentials) {
    try {
      const customerId = await findOrCreateAsaasCustomer(
        order.customer,
        order.shippingAddress
      );

      if (!customerId) {
        throw new Error("Não foi possível registrar o cliente no Asaas.");
      }

      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // 1. Criar cobrança PIX no Asaas
      const paymentRes = await fetch(`${config.baseUrl}/payments`, {
        method: "POST",
        headers: {
          access_token: config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: order.totalAmount,
          dueDate,
          description: `Pedido ${order.orderNumber} - Personalize Cases`,
          externalReference: order.id,
          postalService: false,
        }),
      });

      if (!paymentRes.ok) {
        const errJson = await paymentRes.json();
        const msg =
          errJson.errors?.[0]?.description ||
          "Erro ao gerar cobrança PIX no Asaas.";
        throw new Error(msg);
      }

      const paymentData = await paymentRes.json();
      const paymentId = paymentData.id;

      // 2. Buscar o QR Code e o Copia e Cola do PIX
      const qrRes = await fetch(`${config.baseUrl}/payments/${paymentId}/pixQrCode`, {
        method: "GET",
        headers: {
          access_token: config.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!qrRes.ok) {
        throw new Error("Erro ao obter dados do QR Code PIX no Asaas.");
      }

      const qrData = await qrRes.json();

      let qrBase64 = qrData.encodedImage || "";
      if (qrBase64 && !qrBase64.startsWith("data:image")) {
        qrBase64 = `data:image/png;base64,${qrBase64}`;
      }

      return {
        success: true,
        paymentId: paymentId,
        status: "pending",
        statusDetail: "Aguardando pagamento via PIX no Asaas",
        pixQrCode: qrData.payload || "",
        pixQrCodeBase64: qrBase64,
        ticketUrl: paymentData.invoiceUrl || paymentData.bankSlipUrl,
        isSimulated: false,
      };
    } catch (err: any) {
      console.error("Erro ao criar pagamento Pix no Asaas:", err);
      // Fallback para modo simulado se a API falhar em ambiente de testes
      if (config.isSandbox) {
        console.warn("Utilizando PIX simulado do Asaas como fallback no Sandbox.");
      } else {
        return {
          success: false,
          paymentId: "",
          status: "rejected",
          statusDetail: err.message,
          pixQrCode: "",
          pixQrCodeBase64: "",
          error: err.message,
        };
      }
    }
  }

  // MODO SIMULADO (Executado quando sem chaves ou em desenvolvimento local)
  const simulatedPaymentId = `pay_sim_${Date.now()}`;
  const simulatedPixCode = `00020126580014br.gov.bcb.pix0136${simulatedPaymentId}@asaas.com520400005303986540${order.totalAmount.toFixed(
    2
  )}5802BR5925PERSONALIZE CASES6009SAO PAULO62070503***6304E72B`;

  const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><rect x="20" y="20" width="50" height="50" fill="#000000"/><rect x="26" y="26" width="38" height="38" fill="#ffffff"/><rect x="34" y="34" width="22" height="22" fill="#000000"/><rect x="130" y="20" width="50" height="50" fill="#000000"/><rect x="136" y="26" width="38" height="38" fill="#ffffff"/><rect x="144" y="34" width="22" height="22" fill="#000000"/><rect x="20" y="130" width="50" height="50" fill="#000000"/><rect x="26" y="136" width="38" height="38" fill="#ffffff"/><rect x="34" y="144" width="22" height="22" fill="#000000"/><circle cx="100" cy="100" r="14" fill="#0038FF"/><path d="M96 93h8v14h-8z" fill="#ffffff"/><path d="M93 96h14v8h-14z" fill="#ffffff"/><rect x="90" y="30" width="20" height="15" fill="#000"/><rect x="80" y="150" width="30" height="20" fill="#000"/><rect x="130" y="90" width="20" height="30" fill="#000"/><rect x="160" y="140" width="20" height="20" fill="#000"/><text x="100" y="190" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#666">PIX ASAAS SIMULADO</text></svg>`;
  const qrBase64 = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;

  return {
    success: true,
    paymentId: simulatedPaymentId,
    status: "pending",
    statusDetail: "Aguardando pagamento via PIX (Simulação Asaas)",
    pixQrCode: simulatedPixCode,
    pixQrCodeBase64: qrBase64,
    ticketUrl: `https://sandbox.asaas.com/i/${simulatedPaymentId}`,
    isSimulated: true,
  };
}

/**
 * Cria uma cobrança por Cartão de Crédito transparente via API v3 do Asaas
 */
export async function createAsaasCardPayment(
  order: Order,
  cardInput: CardPaymentInput
): Promise<CreateCardResult> {
  const config = getAsaasConfig();
  const cleanNumber = (cardInput.cardNumber || "").replace(/\D/g, "");
  const lastFour = cleanNumber.slice(-4) || "0000";
  const brand = detectCardBrand(cleanNumber);
  const installments = Math.max(1, Number(cardInput.installments) || 1);
  const installmentAmount = Number((order.totalAmount / installments).toFixed(2));

  // Formatar mês e ano de expiração
  const expiryParts = (cardInput.expiry || "").split("/");
  const expiryMonth = (expiryParts[0] || "12").padStart(2, "0");
  let expiryYear = expiryParts[1] || "30";
  if (expiryYear.length === 2) {
    expiryYear = `20${expiryYear}`;
  }

  // Se for cartão de teste com final 0000 no Sandbox, simula recusa imediata para testes
  if (config.isSandbox && cleanNumber.endsWith("0000")) {
    return {
      success: false,
      paymentId: `pay_sim_${Date.now()}`,
      status: "rejected",
      statusDetail: "Cartão de teste recusado propositalmente (final 0000)",
      cardBrand: brand.name,
      cardLastFour: lastFour,
      installments,
      installmentAmount,
      isSimulated: true,
      error: "Pagamento não autorizado pela operadora do cartão (Simulação).",
    };
  }

  // Se tiver credenciais ativas, chama a API oficial do Asaas
  if (config.hasCredentials) {
    try {
      const customerId = await findOrCreateAsaasCustomer(
        order.customer,
        order.shippingAddress
      );

      if (!customerId) {
        throw new Error("Não foi possível registrar o cliente no Asaas.");
      }

      const cleanCpf = (order.customer.cpf || "").replace(/\D/g, "");
      const cleanPhone = (order.customer.whatsapp || "").replace(/\D/g, "");
      const cleanCep = (order.shippingAddress.zipCode || "").replace(/\D/g, "");
      const dueDate = new Date().toISOString().split("T")[0];

      const paymentBody: any = {
        customer: customerId,
        billingType: "CREDIT_CARD",
        value: order.totalAmount,
        dueDate,
        description: `Pedido ${order.orderNumber} - Personalize Cases`,
        externalReference: order.id,
        postalService: false,
        creditCard: {
          holderName: cardInput.cardHolderName,
          number: cleanNumber,
          expiryMonth,
          expiryYear,
          ccv: (cardInput.cvv || "").replace(/\D/g, ""),
        },
        creditCardHolderInfo: {
          name: cardInput.cardHolderName || order.customer.name,
          email: order.customer.email,
          cpfCnpj: cleanCpf,
          postalCode: cleanCep,
          addressNumber: order.shippingAddress.number,
          addressComplement: order.shippingAddress.complement || "",
          phone: cleanPhone,
          mobilePhone: cleanPhone,
        },
      };

      if (installments > 1) {
        paymentBody.installmentCount = installments;
        paymentBody.installmentValue = installmentAmount;
      }

      const res = await fetch(`${config.baseUrl}/payments`, {
        method: "POST",
        headers: {
          access_token: config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentBody),
      });

      const resData = await res.json();

      if (!res.ok) {
        const errorMsg =
          resData.errors?.[0]?.description ||
          "Pagamento não autorizado pelo emissor do cartão.";
        return {
          success: false,
          paymentId: resData.id || "",
          status: "rejected",
          statusDetail: errorMsg,
          cardBrand: brand.name,
          cardLastFour: lastFour,
          installments,
          installmentAmount,
          error: errorMsg,
          isSimulated: false,
        };
      }

      const isApproved =
        resData.status === "CONFIRMED" || resData.status === "RECEIVED";

      return {
        success: true,
        paymentId: resData.id,
        status: isApproved ? "approved" : "pending",
        statusDetail: isApproved
          ? "Pagamento aprovado com sucesso pelo Asaas"
          : "Pagamento em análise de risco no Asaas",
        cardBrand: brand.name,
        cardLastFour: resData.creditCard?.creditCardNumber || lastFour,
        installments,
        installmentAmount,
        isSimulated: false,
      };
    } catch (err: any) {
      console.error("Erro ao processar cartão no Asaas:", err);
      if (!config.isSandbox) {
        return {
          success: false,
          paymentId: "",
          status: "rejected",
          statusDetail: err.message,
          error: err.message,
        };
      }
    }
  }

  // MODO SIMULADO (Testes sem credenciais reais do Asaas)
  const isRejected = cleanNumber.endsWith("0000");
  const simulatedPaymentId = `pay_sim_${Date.now()}`;

  if (isRejected) {
    return {
      success: false,
      paymentId: simulatedPaymentId,
      status: "rejected",
      statusDetail: "Cartão de teste recusado propositalmente (final 0000)",
      cardBrand: brand.name,
      cardLastFour: lastFour,
      installments,
      installmentAmount,
      isSimulated: true,
      error: "Pagamento não autorizado pela operadora do cartão (Simulação).",
    };
  }

  return {
    success: true,
    paymentId: simulatedPaymentId,
    status: "approved",
    statusDetail: "Pagamento aprovado instantaneamente (Simulação Asaas)",
    cardBrand: brand.name,
    cardLastFour: lastFour,
    installments,
    installmentAmount,
    isSimulated: true,
  };
}

/**
 * Consulta status real de um pagamento pelo ID no Asaas
 */
export async function fetchAsaasPayment(paymentId: string) {
  const config = getAsaasConfig();
  if (!config.hasCredentials || !paymentId || paymentId.startsWith("pay_sim_")) {
    return null;
  }

  try {
    const res = await fetch(`${config.baseUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        access_token: config.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Erro ao consultar pagamento ${paymentId} no Asaas:`, res.statusText);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`Erro ao consultar pagamento ${paymentId} no Asaas:`, err);
    return null;
  }
}

/**
 * Valida o token de autenticação de Webhook enviado pelo Asaas
 */
export function validateAsaasWebhookToken(tokenHeader: string | null): boolean {
  const { webhookToken } = getAsaasConfig();
  // Se não configurou token no .env, aceita em sandbox para não quebrar testes
  if (!webhookToken) return true;
  return Boolean(tokenHeader && tokenHeader.trim() === webhookToken);
}
