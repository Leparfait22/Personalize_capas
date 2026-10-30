import { NextResponse } from "next/server";
import { getMelhorEnvioConfig } from "@/lib/melhor-envio";

export async function GET() {
  const { clientId, redirectUri, apiUrl, environment } = getMelhorEnvioConfig();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: `Configurações ausentes no .env para o ambiente [${environment}]`,
        details: `Defina Client ID e Redirect URI no seu .env para o ambiente [${environment}].`,
      },
      { status: 400 }
    );
  }

  // Escopos necessários para cotar fretes, pagar carrinho, gerar e imprimir etiquetas no Melhor Envio
  const scopes = [
    "shipping-calculate",
    "shipping-companies",
    "cart-read",
    "cart-write",
    "shipping-checkout",
    "shipping-generate",
    "shipping-print",
    "orders-read",
    "shipping-tracking",
  ].join(" ");
  const authUrl = `${apiUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scopes)}`;

  return NextResponse.redirect(authUrl);
}
