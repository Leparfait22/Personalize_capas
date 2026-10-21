import { NextResponse } from "next/server";
import { getMercadoPagoConfig } from "@/lib/mercadopago";

export async function GET() {
  const config = getMercadoPagoConfig();

  return NextResponse.json({
    status: "ok",
    environment: config.environment,
    hasCredentials: config.hasCredentials,
    isSandbox: config.isSandbox,
    publicKey: config.publicKey || null,
    hasWebhookSecret: Boolean(config.webhookSecret),
    supportedMethods: ["pix", "credit_card", "debit_card"],
    nextStep: config.hasCredentials
      ? `Mercado Pago ativo no ambiente [${config.environment.toUpperCase()}].`
      : "Configure MERCADOPAGO_ACCESS_TOKEN e NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no seu .env para pagamentos reais.",
  });
}
