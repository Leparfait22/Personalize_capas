import { NextResponse } from "next/server";
import { getAsaasConfig } from "@/lib/asaas";

export async function GET() {
  const config = getAsaasConfig();

  if (!config.hasCredentials) {
    return NextResponse.json({
      connected: false,
      status: "missing_credentials",
      gateway: "asaas",
      environment: config.environment,
      message: "Nenhuma chave de API do Asaas encontrada no .env.",
    });
  }

  try {
    // Testa a conexão em tempo real chamando a API do Asaas
    const res = await fetch(`${config.baseUrl}/myAccount`, {
      method: "GET",
      headers: {
        access_token: config.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          connected: false,
          status: "auth_failed",
          gateway: "asaas",
          environment: config.environment,
          httpStatus: res.status,
          error: "A chave de API informada foi recusada pelo Asaas.",
          details: err,
        },
        { status: 401 }
      );
    }

    const account = await res.json();

    return NextResponse.json({
      connected: true,
      status: "authenticated",
      gateway: "asaas",
      environment: config.environment,
      account: {
        name: account.name,
        email: account.email,
        cpfCnpj: account.cpfCnpj ? `***${account.cpfCnpj.slice(-4)}` : null,
        city: account.city?.name,
        state: account.city?.state,
        accountStatus: account.status,
      },
      hasWebhookToken: Boolean(config.webhookToken),
      webhookEndpoint: "/api/payment/webhook",
      supportedMethods: ["pix", "credit_card"],
      message: `Conexão estabelecida com sucesso no Asaas [${config.environment.toUpperCase()}] (${account.name}).`,
    });
  } catch (err: any) {
    console.error("Erro ao testar conexão com o Asaas:", err);
    return NextResponse.json(
      {
        connected: false,
        status: "network_error",
        error: "Erro ao comunicar com os servidores do Asaas.",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}
