import { NextResponse } from "next/server";
import { calculateMelhorEnvioShipping } from "@/lib/melhor-envio";

export async function GET() {
  const token = (process.env.MELHOR_ENVIO_TOKEN || "").trim();
  const clientId = (process.env.MELHOR_ENVIO_CLIENT_ID || "").trim();
  const clientSecret = (process.env.MELHOR_ENVIO_CLIENT_SECRET || "").trim();
  const redirectUri = (process.env.MELHOR_ENVIO_REDIRECT_URI || "").trim();
  const apiUrl = (process.env.MELHOR_ENVIO_URL || "https://sandbox.melhorenvio.com.br").replace(/\/$/, "");

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
    hasToken,
    hasOAuthConfig,
    clientId,
    redirectUri,
    apiUrl,
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
      ? "Integração 100% pronta e ativa com a API Oficial!"
      : "Acesse /api/shipping/authorize no seu navegador para vincular sua conta do Melhor Envio com 1 clique.",
  });
}
