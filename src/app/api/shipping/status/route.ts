import { NextResponse } from "next/server";
import { calculateMelhorEnvioShipping, getMelhorEnvioConfig } from "@/lib/melhor-envio";

export async function GET() {
  const config = getMelhorEnvioConfig();
  const token = config.token;
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;
  const redirectUri = config.redirectUri;
  const apiUrl = config.apiUrl;

  const hasToken = token.length > 20;
  const hasOAuthConfig = Boolean(clientId && clientSecret && redirectUri);

  // Executa uma cotação de teste para avaliar a conexão real
  const testQuote = await calculateMelhorEnvioShipping({
    toCep: "01310-100",
    itemsCount: 1,
    subtotal: 79.90,
  });

  return NextResponse.json({
    status: "ok",
    environment: config.environment,
    apiUrl,
    hasToken,
    hasOAuthConfig,
    clientId: clientId ? `${clientId.slice(0, 4)}...` : "",
    redirectUri,
    isFallback: testQuote.isFallback,
    liveApiConnected: hasToken && !testQuote.isFallback,
    testQuoteOptionsCount: testQuote.options.length,
    testQuoteSample: testQuote.options.map((o) => ({
      carrier: o.company.name,
      service: o.name,
      price: o.price,
      deliveryTimeDays: o.deliveryTime,
    })),
    nextStep: hasToken
      ? `Integração 100% pronta e ativa no ambiente [${config.environment.toUpperCase()}]!`
      : `Acesse /api/shipping/authorize no seu navegador para vincular sua conta do Melhor Envio (${config.environment}).`,
  });
}
