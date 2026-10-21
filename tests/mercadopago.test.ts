import assert from "node:assert";
import {
  detectCardBrand,
  getMercadoPagoConfig,
  createPixPayment,
  createCardPayment,
  validateWebhookSignature,
} from "../src/lib/mercadopago";
import { Order } from "../src/types";

const mockOrder: Order = {
  id: "ord_test_mp_1001",
  orderNumber: "SC-9999",
  customer: {
    name: "Leonardo Da Vinci",
    email: "leonardo@snapcase.com.br",
    whatsapp: "11988887777",
    cpf: "123.456.789-00",
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
        cameraModule: { x: 6, y: 3.5, width: 42, height: 23, shape: "rounded-square" },
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

async function runMercadoPagoTests() {
  console.log("\n=======================================================");
  console.log("💳 TESTES DE INTEGRAÇÃO DO MERCADO PAGO");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Detalhes: ${err.message}`);
      failed++;
    }
  }

  // 1. Detecção de Bandeiras de Cartão
  test("Detecção correta da bandeira Visa", () => {
    const res = detectCardBrand("4000 1234 5678 9010");
    assert.strictEqual(res.id, "visa");
    assert.strictEqual(res.name, "Visa");
    assert.strictEqual(res.isDebitSupported, true);
  });

  test("Detecção correta da bandeira Mastercard", () => {
    const res = detectCardBrand("5500 0000 0000 0004");
    assert.strictEqual(res.id, "master");
    assert.strictEqual(res.name, "Mastercard");
    assert.strictEqual(res.isDebitSupported, true);
  });

  test("Detecção correta da bandeira Elo", () => {
    const res = detectCardBrand("6363 6800 0000 0000");
    assert.strictEqual(res.id, "elo");
    assert.strictEqual(res.name, "Elo");
  });

  test("Detecção correta da bandeira Hipercard", () => {
    const res = detectCardBrand("6062 8200 0000 0000");
    assert.strictEqual(res.id, "hipercard");
    assert.strictEqual(res.name, "Hipercard");
  });

  test("Detecção correta da bandeira American Express", () => {
    const res = detectCardBrand("3782 8224 6310 005");
    assert.strictEqual(res.id, "amex");
    assert.strictEqual(res.name, "American Express");
  });

  // 2. Configuração do Mercado Pago
  test("Leitura de configuração de ambiente do Mercado Pago", () => {
    const config = getMercadoPagoConfig();
    assert.ok(["sandbox", "production"].includes(config.environment));
    assert.strictEqual(typeof config.hasCredentials, "boolean");
  });

  // 3. Geração de Pagamento PIX com QR Code
  await (async () => {
    try {
      const pixResult = await createPixPayment(mockOrder);
      assert.strictEqual(pixResult.success, true, "PIX criado com sucesso");
      assert.ok(pixResult.paymentId, "ID de pagamento retornado");
      assert.ok(pixResult.pixQrCode.length > 20, "String Copia e Cola EMV gerada");
      assert.ok(pixResult.pixQrCodeBase64.length > 20, "Imagem QR Code Base64 gerada");
      assert.strictEqual(pixResult.status, "pending", "Status inicial do PIX é pending");
      console.log("✅ PASS: Geração de cobrança PIX com QR Code Base64 e Copia e Cola");
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: Geração de cobrança PIX: ${err.message}`);
      failed++;
    }
  })();

  // 4. Processamento de Cartão de Crédito
  await (async () => {
    try {
      const creditOrder: Order = { ...mockOrder, paymentMethod: "credit_card" };
      const cardResult = await createCardPayment(creditOrder, {
        cardNumber: "4000 1234 5678 9010",
        cardHolderName: "LEONARDO DA VINCI",
        expiry: "12/28",
        cvv: "123",
        installments: 3,
        isDebit: false,
      });

      assert.strictEqual(cardResult.success, true, "Cartão de Crédito processado com sucesso");
      assert.strictEqual(cardResult.installments, 3, "Número correto de parcelas");
      assert.strictEqual(cardResult.cardLastFour, "9010", "Captura dos últimos 4 dígitos");
      assert.strictEqual(cardResult.isDebit, false, "Sinalizado como crédito");
      assert.strictEqual(cardResult.status, "approved", "Status aprovado");
      console.log("✅ PASS: Processamento de Cartão de Crédito parcelado (3x)");
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: Processamento de Cartão de Crédito: ${err.message}`);
      failed++;
    }
  })();

  // 5. Processamento de Cartão de Débito
  await (async () => {
    try {
      const debitOrder: Order = { ...mockOrder, paymentMethod: "debit_card" };
      const debitResult = await createCardPayment(debitOrder, {
        cardNumber: "5500 0000 0000 1234",
        cardHolderName: "LEONARDO DA VINCI",
        expiry: "08/29",
        cvv: "456",
        isDebit: true,
      });

      assert.strictEqual(debitResult.success, true, "Cartão de Débito processado com sucesso");
      assert.strictEqual(debitResult.isDebit, true, "Sinalizado como débito");
      assert.strictEqual(debitResult.installments, 1, "Débito é estritamente à vista (1x)");
      assert.strictEqual(debitResult.cardLastFour, "1234", "Captura dos 4 últimos dígitos do débito");
      console.log("✅ PASS: Processamento de Cartão de Débito à vista com aprovação");
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: Processamento de Cartão de Débito: ${err.message}`);
      failed++;
    }
  })();

  // 6. Resiliência de Webhook e Assinatura
  test("Resiliência na validação de Webhooks do Mercado Pago", () => {
    // Sem chave configurada, deve operar de forma permissiva em dev
    const validDev = validateWebhookSignature(null, null, "12345");
    assert.strictEqual(validDev, true);
  });

  console.log("\n=======================================================");
  console.log(`📊 TOTAL: ${passed + failed} | ✅ PASSOU: ${passed} | ❌ FALHOU: ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMercadoPagoTests().catch((err) => {
  console.error("Erro fatal nos testes do Mercado Pago:", err);
  process.exit(1);
});
