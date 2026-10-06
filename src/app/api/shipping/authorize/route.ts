import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID?.trim();
  const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI?.trim();
  const apiUrl = (process.env.MELHOR_ENVIO_URL || "https://sandbox.melhorenvio.com.br").replace(/\/$/, "");

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "Configurações ausentes no .env",
        details: "Defina MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_REDIRECT_URI no seu .env para autorizar o aplicativo.",
      },
      { status: 400 }
    );
  }

  // Escopos necessários para cotar fretes e gerenciar etiquetas no Melhor Envio
  const scopes = "shipping-calculate shipping-companies cart-read cart-write";
  const authUrl = `${apiUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scopes)}`;

  return NextResponse.redirect(authUrl);
}
