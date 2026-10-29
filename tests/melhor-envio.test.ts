import {
  calculateMelhorEnvioShipping,
  cleanCep,
  isValidCep,
  generateMelhorEnvioLabel,
} from "../src/lib/melhor-envio";

async function runShippingTests() {
  console.log("\n=======================================================");
  console.log("📦 TESTES DO SERVIÇO DE ENVIO & MELHOR ENVIO");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details || ""}`);
      failed++;
    }
  }

  // Teste 1: Validação e Limpeza de CEP
  const cleaned = cleanCep("01310-100");
  assert(cleaned === "01310100", "Limpeza de caracteres não numéricos do CEP");
  assert(isValidCep("01310100") === true, "Validação de CEP válido com 8 dígitos");
  assert(isValidCep("123") === false, "Rejeição de CEP com menos de 8 dígitos");
  assert(isValidCep("11111111") === false, "Rejeição de CEP com números todos iguais");

  // Teste 2: Cotação para CEP válido (Modo Fallback / Sandbox)
  const resultSP = await calculateMelhorEnvioShipping({
    toCep: "01310-100",
    itemsCount: 1,
    subtotal: 79.90,
  });

  assert(resultSP.success === true, "Cotação bem-sucedida para CEP de SP");
  assert(resultSP.options.length >= 3, "Retorno de pelo menos 3 opções de frete (Correios/Jadlog)");
  
  const hasJadlog = resultSP.options.some((o) => o.company.name.toLowerCase().includes("jadlog"));
  const hasCorreios = resultSP.options.some((o) => o.company.name.toLowerCase().includes("correios"));
  assert(hasJadlog && hasCorreios, "Opções incluem Jadlog e Correios");

  // Teste 3: Rejeição de CEP inválido
  const resultInvalid = await calculateMelhorEnvioShipping({
    toCep: "invalido",
    itemsCount: 1,
    subtotal: 79.90,
  });
  assert(resultInvalid.success === false, "Bloqueio de cotação para CEP inválido");
  assert(resultInvalid.options.length === 0, "Nenhuma opção retornada para CEP inválido");

  // Teste 4: Regra de Frete Grátis acima de R$ 149
  const resultFreeShipping = await calculateMelhorEnvioShipping({
    toCep: "01310-100",
    itemsCount: 2,
    subtotal: 159.80, // Acima de R$ 149
  });

  const cheapestOption = resultFreeShipping.options.find((o) => o.finalPrice === 0);
  assert(
    Boolean(cheapestOption),
    "Opção mais econômica zerada (R$ 0,00) para compras acima de R$ 149 (Frete Grátis)"
  );

  // Teste 5: Cotação para outra região do Brasil (ex: Nordeste - Salvador/BA)
  const resultBA = await calculateMelhorEnvioShipping({
    toCep: "40020-000",
    itemsCount: 1,
    subtotal: 79.90,
  });
  assert(resultBA.success === true, "Cotação bem-sucedida para Nordeste (Salvador/BA)");
  const hasRealisticDelivery = resultBA.options.some((o) => o.deliveryTime >= 4);
  assert(hasRealisticDelivery, "Prazo de entrega realista calculado por região (>= 4 dias úteis)");

  // Teste 6: Disponibilidade e contrato da função de emissão de etiquetas
  assert(
    typeof generateMelhorEnvioLabel === "function",
    "Função generateMelhorEnvioLabel disponível para compra e geração de etiquetas"
  );

  console.log("\n=======================================================");
  console.log(`📊 TOTAL: ${passed + failed} | ✅ PASSOU: ${passed} | ❌ FALHOU: ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runShippingTests().catch((err) => {
  console.error("Erro fatal no teste de envio:", err);
  process.exit(1);
});
