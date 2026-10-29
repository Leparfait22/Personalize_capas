import assert from "node:assert";
import {
  detectCardBrand,
  getAsaasConfig,
  createAsaasPixPayment,
  createAsaasCardPayment,
  validateAsaasWebhookToken,
} from "../src/lib/asaas";
import { Order } from "../src/types";

const mockOrder: Order = {
  id: "ord_test_asaas_1001",
  orderNumber: "SC-7777",
  customer: {
    name: "Leonardo Da Vinci",
    email: "leonardo@snapcase.com.br",
    whatsapp: "11988887777",
    cpf: "244.264.918-78",
  },
  shippingAddress: {
    zipCode: "01310-100",
    street: "Avenida Paulista",
    number: "1000",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  },
  items: [
    {
      id: "item_test_1",
      model: {
        id: "iphone-16-pro",
        name: "iPhone 16 Pro",
        brand: "Apple",
        basePrice: 79.9,
        dimensionsMm: { width: 71.5, height: 149.6, thickness: 8.25 },
        aspectRatio: 0.48,
        cornerRadius: 14,
        cameraModule: { x: 6, y: 3.5, width: 42, height: 23, borderRadius: 12, shape: "rounded-square" },
      },
      finish: {
        id: "matte",
        name: "Fosco Aveludado",
        subtitle: "",
        description: "",
        priceAdd: 0,
        borderStyle: "matte",
        features: [],
      },
      caseColor: "#000000",
      customization: {
        imageUrl: "https://example.com/art.png",
        scale: 1,
        position: { x: 0, y: 0 },
        rotation: 0,
      },
      previewMockupUrl: "https://example.com/mockup.png",
      highResPrintUrl: "https://example.com/print.png",
      quantity: 1,
      unitPrice: 79.9,
      totalPrice: 79.9,
      createdAt: new Date().toISOString(),
    },
  ],
  subtotal: 79.9,
  shippingCost: 15.0,
  discount: 3.99,
  totalAmount: 90.91,
  paymentMethod: "pix",
  paymentStatus: "pending",
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function runAsaasTests() {
  console.log("\n=======================================================");
  console.log("💳 TESTES DE INTEGRAÇÃO DO GATEWAY ASAAS");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Detalhes: ${err.message}`);
      failed++;
    }
  }

  // 1. Detecção de Bandeiras de Cartão
  await test("Detecção correta da bandeira Visa", () => {
    const res = detectCardBrand("4000 1234 5678 9010");
    assert.strictEqual(res.id, "visa");
    assert.strictEqual(res.name, "Visa");
    assert.strictEqual(res.isDebitSupported, true);
  });

  await test("Detecção correta da bandeira Mastercard", () => {
    const res = detectCardBrand("5500 0000 0000 0004");
    assert.strictEqual(res.id, "master");
    assert.strictEqual(res.name, "Mastercard");
    assert.strictEqual(res.isDebitSupported, true);
  });

  await test("Detecção correta da bandeira Elo", () => {
    const res = detectCardBrand("6363 6800 0000 0000");
    assert.strictEqual(res.id, "elo");
    assert.strictEqual(res.name, "Elo");
  });

  await test("Detecção correta da bandeira Hipercard", () => {
    const res = detectCardBrand("6062 8200 0000 0000");
    assert.strictEqual(res.id, "hipercard");
    assert.strictEqual(res.name, "Hipercard");
  });

  await test("Detecção correta da bandeira Amex", () => {
    const res = detectCardBrand("3782 8224 6310 005");
    assert.strictEqual(res.id, "amex");
    assert.strictEqual(res.name, "American Express");
  });

  // 2. Leitura de Configuração do Asaas e Auto-detecção de Ambiente
  await test("Leitura de configuração padrão sem chave (Modo Simulado / Sandbox)", () => {
    const config = getAsaasConfig();
    assert.ok(["sandbox", "production"].includes(config.environment));
    assert.ok(config.baseUrl.includes("asaas.com"));
  });

  await test("Detecção automática de chave de Produção do Asaas", () => {
    const originalKey = process.env.ASAAS_API_KEY;
    try {
      process.env.ASAAS_API_KEY = "$aact_prod_999999999999999999999999";
      const config = getAsaasConfig();
      assert.strictEqual(config.environment, "production");
      assert.strictEqual(config.isSandbox, false);
      assert.strictEqual(config.baseUrl, "https://api.asaas.com/v3");
      assert.strictEqual(config.hasCredentials, true);
    } finally {
      process.env.ASAAS_API_KEY = originalKey;
    }
  });

  await test("Detecção automática de chave de Homologação / Sandbox do Asaas", () => {
    const originalKey = process.env.ASAAS_API_KEY;
    try {
      process.env.ASAAS_API_KEY = "$aact_hmlg_111111111111111111111111";
      const config = getAsaasConfig();
      assert.strictEqual(config.environment, "sandbox");
      assert.strictEqual(config.isSandbox, true);
      assert.strictEqual(config.baseUrl, "https://api-sandbox.asaas.com/v3");
      assert.strictEqual(config.hasCredentials, true);
    } finally {
      process.env.ASAAS_API_KEY = originalKey;
    }
  });

  // 3. Geração de PIX (Modo Simulado / Fallback Resiliente)
  await test("Geração de PIX com QR Code e Copia e Cola", async () => {
    const pixRes = await createAsaasPixPayment(mockOrder);
    assert.strictEqual(pixRes.success, true);
    assert.strictEqual(pixRes.status, "pending");
    assert.ok(pixRes.paymentId.length > 0);
    assert.ok(pixRes.pixQrCode.length > 20);
    assert.ok(pixRes.pixQrCodeBase64.startsWith("data:image"));
    assert.ok(pixRes.pixQrCode.includes("asaas.com") || pixRes.pixQrCode.includes("br.gov.bcb.pix"));
  });

  // 4. Cartão de Crédito Transparente - Pagamento Aprovado
  await test("Processamento de Cartão de Crédito Transparente (Aprovado)", async () => {
    const cardRes = await createAsaasCardPayment(mockOrder, {
      cardNumber: "4000123456789010",
      cardHolderName: "LEONARDO DA VINCI",
      expiry: "12/28",
      cvv: "123",
      installments: 3,
    });

    assert.strictEqual(cardRes.success, true);
    assert.strictEqual(cardRes.status, "approved");
    assert.strictEqual(cardRes.cardBrand, "Visa");
    assert.strictEqual(cardRes.cardLastFour, "9010");
    assert.strictEqual(cardRes.installments, 3);
    assert.strictEqual(cardRes.installmentAmount, 30.3); // 90.91 / 3 = 30.30
  });

  // 5. Cartão de Crédito Transparente - Recusa proposital (Simulação de erro)
  await test("Processamento de Cartão de Crédito - Recusa proposital (final 0000)", async () => {
    const cardRes = await createAsaasCardPayment(mockOrder, {
      cardNumber: "4000123456780000",
      cardHolderName: "LEONARDO DA VINCI",
      expiry: "12/28",
      cvv: "123",
      installments: 1,
    });

    assert.strictEqual(cardRes.success, false);
    assert.strictEqual(cardRes.status, "rejected");
    assert.ok(cardRes.error && cardRes.error.length > 0);
  });

  // 6. Validação de Webhook do Asaas
  await test("Validação de Token de Webhook do Asaas", () => {
    const isValid = validateAsaasWebhookToken("token-teste-ou-padrao");
    assert.strictEqual(typeof isValid, "boolean");
  });

  console.log("\n-------------------------------------------------------");
  console.log(`📊 RESULTADO DOS TESTES DO ASAAS: ${passed} passaram | ${failed} falharam`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAsaasTests();
