/**
 * Bateria de Testes de Penetração e Ataques de Autenticação
 * 
 * Simula vetores de ataque comuns contra a camada de Auth da SnapCase:
 * 1. SQL Injection / Auth Bypass no Login
 * 2. NoSQL / Type Confusion Injection
 * 3. Elevação de Privilégios no Registro (Mass Assignment)
 * 4. Falsificação / Tampering de Cookie de Sessão (Broken Access Control)
 * 5. BOLA / IDOR (Tentativa de visualização de pedidos de terceiros)
 * 6. Credenciais Inválidas & Tentativa de Enumeração
 * 7. DoS por Buffer Bloating (Payloads de 1MB)
 * 8. Sanitização de Caracteres Nulos / Truncamento
 * 9. Encerramento de Sessão (Logout)
 */

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
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const icon = passed ? "🛡️ PASSOU (Bloqueado)" : "❌ FALHOU (Vulnerável)";
  console.log(`${icon} [${category}] ${name}`);
  console.log(`   └─ Detalhes: ${details}\n`);
}

async function simulateRequest(
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
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

  const response = await handler(request);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, headers: response.headers };
}

export async function runAuthAttackTests() {
  console.log("===================================================================");
  console.log("🔒 SIMULAÇÃO DE ATAQUES DE SEGURANÇA E TESTES DE PENETRAÇÃO (AUTH)");
  console.log("===================================================================\n");

  const { POST: loginHandler } = await import("../src/app/api/auth/login/route");
  const { POST: registerHandler } = await import("../src/app/api/auth/register/route");
  const { GET: ordersHandler } = await import("../src/app/api/orders/route");
  const { POST: logoutHandler } = await import("../src/app/api/auth/logout/route");
  const { PATCH: updateOrderStatusHandler } = await import("../src/app/api/orders/[id]/status/route");

  // -------------------------------------------------------------------------
  // 1. ATAQUE: SQL Injection Clássico no Login (Auth Bypass)
  // -------------------------------------------------------------------------
  try {
    const sqliPayloads = [
      { email: "admin' OR '1'='1", password: "' OR '1'='1" },
      { email: "admin' --", password: "irrelevant_password" },
      { email: "' UNION SELECT * FROM users --", password: "123" },
    ];

    let allBlocked = true;
    let detailMsg = "";

    for (const payload of sqliPayloads) {
      const res = await simulateRequest(
        loginHandler,
        "http://localhost:3000/api/auth/login",
        "POST",
        payload
      );

      // Deve ser 401 Unauthorized e NÃO autenticar
      if (res.status === 200 || res.data?.user?.isAdmin) {
        allBlocked = false;
        detailMsg = `Payload "${payload.email}" obteve sucesso inesperado (HTTP ${res.status})`;
        break;
      }
    }

    if (allBlocked) {
      detailMsg = "Todos os 3 payloads de SQL Injection foram barrados com HTTP 401.";
    }

    recordTest(
      "Injeção SQL",
      "Bypass de Login via SQL Injection (' OR '1'='1 / UNION)",
      allBlocked,
      detailMsg
    );
  } catch (err: any) {
    recordTest("Injeção SQL", "Bypass de Login via SQL Injection", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 2. ATAQUE: Injeção NoSQL / Confusão de Tipos (Type Confusion)
  // -------------------------------------------------------------------------
  try {
    // Injetando objetos em vez de strings primitivas (comum em ataques de bypass NoSQL)
    const nosqlPayload = {
      email: { $gt: "" },
      password: { $ne: null },
    };

    const res = await simulateRequest(
      loginHandler,
      "http://localhost:3000/api/auth/login",
      "POST",
      nosqlPayload
    );

    // O sistema deve tratar sem quebrar (500) e recusar a autenticação (400 ou 401)
    const isSafe = res.status === 400 || res.status === 401;
    recordTest(
      "Type Confusion / NoSQL",
      "Tentativa de injeção de operadores de objeto { $gt: '' }",
      isSafe,
      `Status HTTP retornado: ${res.status} | Resposta: ${JSON.stringify(res.data)}`
    );
  } catch (err: any) {
    recordTest("Type Confusion / NoSQL", "Tentativa de injeção NoSQL", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 3. ATAQUE: Elevação de Privilégio no Registro (Mass Assignment)
  // -------------------------------------------------------------------------
  try {
    const maliciousRegister = {
      name: "Attacker",
      email: `evil_admin_${Date.now()}@hack.com`,
      password: "StrongPassword123!",
      role: "admin",
      isAdmin: true,
      is_admin: true,
      permissions: ["*"],
    };

    const res = await simulateRequest(
      registerHandler,
      "http://localhost:3000/api/auth/register",
      "POST",
      maliciousRegister
    );

    // O servidor DEVE forçar isAdmin = false
    const isAdminIgnored = res.data?.user?.isAdmin === false;
    const isProtected = res.status === 200 && isAdminIgnored;

    recordTest(
      "Elevação de Privilégio",
      "Forjamento de 'role: admin' e 'isAdmin: true' no cadastro",
      isProtected,
      `Status HTTP: ${res.status} | Propriedade isAdmin retornada: ${res.data?.user?.isAdmin}`
    );
  } catch (err: any) {
    recordTest("Elevação de Privilégio", "Forjamento de role admin", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 4. ATAQUE: Forjamento de Cookie de Sessão / JSON Corrompido
  // -------------------------------------------------------------------------
  try {
    // 4.1 Cookie malformado / JSON truncado
    const corruptCookieRes = await simulateRequest(
      ordersHandler,
      "http://localhost:3000/api/orders",
      "GET",
      undefined,
      { cookie: "snapcase_admin_session={isAdmin:true,corrupt" }
    );

    // Não deve dar crash 500 não tratado; deve retornar lista vazia ou 401
    const handlesCorrupt = corruptCookieRes.status === 200 || corruptCookieRes.status === 401;

    recordTest(
      "Integridade de Sessão",
      "Resiliência contra Cookie HTTP com JSON corrompido/malformado",
      handlesCorrupt,
      `Status HTTP: ${corruptCookieRes.status} | Servidor manteve estabilidade sem crash`
    );

    // 4.2 Ação administrativa sem privilégios (Broken Access Control)
    const fakeCustomerCookie = `snapcase_admin_session=${encodeURIComponent(
      JSON.stringify({ email: "cliente@comum.com", isAdmin: false })
    )}`;

    const patchRes = await simulateRequest(
      (req) => updateOrderStatusHandler(req, { params: Promise.resolve({ id: "order_123" }) }),
      "http://localhost:3000/api/orders/order_123/status",
      "PATCH",
      { status: "delivered" },
      { cookie: fakeCustomerCookie }
    );

    // Como o teste roda fora do contexto do middleware do Next, isServerAdmin() valida o cookie
    // O status DEVE ser 403 Forbidden para quem não for admin
    const isForbidden = patchRes.status === 403;

    recordTest(
      "Controle de Acesso (BAC)",
      "Bloqueio de usuário não-admin tentando alterar status de pedido (403)",
      isForbidden,
      `Status HTTP: ${patchRes.status} | Erro: "${patchRes.data?.error || 'Nenhum'}"`
    );
  } catch (err: any) {
    recordTest("Controle de Acesso", "Manipulação de Cookie e BAC", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 5. ATAQUE: BOLA / IDOR (Tentativa de visualização de pedidos de terceiros)
  // -------------------------------------------------------------------------
  try {
    // Visitante sem autenticação tentando listar pedidos
    const anonRes = await simulateRequest(
      ordersHandler,
      "http://localhost:3000/api/orders",
      "GET"
    );

    // Sem sessão no servidor, a rota de pedidos retorna array vazio [] (não vaza pedidos da loja)
    const ordersHiddenFromAnon = Array.isArray(anonRes.data) && anonRes.data.length === 0;

    recordTest(
      "Proteção BOLA / IDOR",
      "Ocultação da lista geral de pedidos para visitantes não autenticados",
      ordersHiddenFromAnon,
      `Status: ${anonRes.status} | Total de pedidos vazados para anônimo: ${anonRes.data?.length ?? 0}`
    );
  } catch (err: any) {
    recordTest("Proteção BOLA / IDOR", "Vazamento de pedidos", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 6. ATAQUE: Credenciais Vazias / Maliciosas / Brute-force Probe
  // -------------------------------------------------------------------------
  try {
    const emptyRes = await simulateRequest(
      loginHandler,
      "http://localhost:3000/api/auth/login",
      "POST",
      { email: "   ", password: "" }
    );

    const wrongPassRes = await simulateRequest(
      loginHandler,
      "http://localhost:3000/api/auth/login",
      "POST",
      { email: "usuario_existente@exemplo.com", password: "senha_totalmente_errada_123" }
    );

    const emptyBlocked = emptyRes.status === 400;
    const wrongBlocked = wrongPassRes.status === 401;

    recordTest(
      "Validação de Credenciais",
      "Rejeição estrita de credenciais vazias (400) e senhas erradas (401)",
      emptyBlocked && wrongBlocked,
      `E-mail vazio -> HTTP ${emptyRes.status} | Senha incorreta -> HTTP ${wrongPassRes.status}`
    );
  } catch (err: any) {
    recordTest("Validação de Credenciais", "Rejeição de credenciais inválidas", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 7. ATAQUE: DoS por Buffer Bloating (Payload de 1MB de caracteres)
  // -------------------------------------------------------------------------
  try {
    const giantString = "A".repeat(1024 * 1024); // 1 Megabyte de texto
    const bloatedPayload = {
      email: `${giantString}@hack.com`,
      password: giantString,
    };

    const startTime = Date.now();
    const res = await simulateRequest(
      loginHandler,
      "http://localhost:3000/api/auth/login",
      "POST",
      bloatedPayload
    );
    const durationMs = Date.now() - startTime;

    // Deve responder rapidamente rejeitando (401 ou 400), sem travamento de CPU (ReDoS)
    const isHandled = (res.status === 401 || res.status === 400) && durationMs < 3000;

    recordTest(
      "Resiliência DoS / Buffer",
      "Processamento seguro de payload inflado de 1MB sem travamento",
      isHandled,
      `Status HTTP: ${res.status} | Tempo de resposta: ${durationMs}ms`
    );
  } catch (err: any) {
    recordTest("Resiliência DoS", "Payload inflado", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 8. ATAQUE: Injeção de Caracteres Nulos (Null Byte Injection)
  // -------------------------------------------------------------------------
  try {
    const nullBytePayload = {
      email: "admin%00@snapcasebr.com\0admin",
      password: "password\0injected",
    };

    const res = await simulateRequest(
      loginHandler,
      "http://localhost:3000/api/auth/login",
      "POST",
      nullBytePayload
    );

    // O sistema não deve ser enganado por byte nulo para coincidir com a conta admin
    const blocked = res.status === 401 && !res.data?.user?.isAdmin;

    recordTest(
      "Null Byte Injection",
      "Bloqueio de caracteres nulos (\\0) no e-mail e na senha",
      blocked,
      `Status HTTP: ${res.status} | Acesso administrativo concedido: ${Boolean(res.data?.user?.isAdmin)}`
    );
  } catch (err: any) {
    recordTest("Null Byte Injection", "Caracteres nulos", false, err.message);
  }

  // -------------------------------------------------------------------------
  // 9. CICLO DE VIDA: Logout e Destruição de Sessão
  // -------------------------------------------------------------------------
  try {
    const logoutRes = await simulateRequest(
      logoutHandler,
      "http://localhost:3000/api/auth/logout",
      "POST"
    );

    const isLogoutOk = logoutRes.status === 200 && logoutRes.data?.success === true;

    recordTest(
      "Encerramento de Sessão",
      "Invalidação de sessão com limpeza de cookie no Logout",
      isLogoutOk,
      `Status HTTP: ${logoutRes.status} | Sucesso: ${logoutRes.data?.success}`
    );
  } catch (err: any) {
    recordTest("Encerramento de Sessão", "Logout", false, err.message);
  }

  // -------------------------------------------------------------------------
  // RELATÓRIO FINAL
  // -------------------------------------------------------------------------
  console.log("===================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`📊 RELATÓRIO FINAL DOS TESTES DE ATAQUE:`);
  console.log(`   - Total de Vetores Testados: ${total}`);
  console.log(`   - Bloqueados com Sucesso (Aprovados): ${passed}`);
  console.log(`   - Vulnerabilidades Detectadas (Falhas): ${failed}`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Execução direta via CLI
runAuthAttackTests().catch((err) => {
  console.error("Erro fatal na execução dos testes de ataque:", err);
  process.exit(1);
});
