import { calculateMelhorEnvioShipping } from "@/lib/melhor-envio";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Erro de Autorização</title></head>
      <body style="font-family: -apple-system, sans-serif; padding: 40px; text-align: center; background: #fafafa;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; border: 1px solid #e4e4e7;">
          <h2 style="color: #e11d48; margin-top: 0;">Erro na Autorização do Melhor Envio</h2>
          <p style="color: #52525b; font-size: 14px;">${error}: ${errorDescription || "Acesso recusado ou expirado."}</p>
          <a href="/api/shipping/authorize" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #09090b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Tentar Novamente</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  if (!code) {
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Código não encontrado</title></head>
      <body style="font-family: -apple-system, sans-serif; padding: 40px; text-align: center; background: #fafafa;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; border: 1px solid #e4e4e7;">
          <h2 style="color: #e11d48; margin-top: 0;">Código de Autorização Ausente</h2>
          <p style="color: #52525b; font-size: 14px;">Nenhum parâmetro <code>code</code> foi recebido nesta requisição.</p>
          <a href="/api/shipping/authorize" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #09090b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Iniciar Autorização</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID?.trim();
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET?.trim();
  const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI?.trim();
  const apiUrl = (process.env.MELHOR_ENVIO_URL || "https://sandbox.melhorenvio.com.br").replace(/\/$/, "");
  const appContact = process.env.MELHOR_ENVIO_APP_CONTACT || "contato@snapcasebr.com";

  try {
    const tokenRes = await fetch(`${apiUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": `PersonalizeCases (${appContact})`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Erro na resposta do /oauth/token:", tokenData);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Erro de Token</title></head>
        <body style="font-family: -apple-system, sans-serif; padding: 40px; text-align: center; background: #fafafa;">
          <div style="max-width: 540px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; border: 1px solid #e4e4e7;">
            <h2 style="color: #e11d48; margin-top: 0;">Falha ao obter Access Token</h2>
            <p style="color: #52525b; font-size: 13px;">O Melhor Envio retornou a seguinte mensagem:</p>
            <pre style="background: #f4f4f5; padding: 12px; border-radius: 8px; font-size: 12px; text-align: left; overflow-x: auto;">${JSON.stringify(
              tokenData,
              null,
              2
            )}</pre>
            <a href="/api/shipping/authorize" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #09090b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Tentar Novamente</a>
          </div>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Persistir automaticamente no arquivo .env
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        if (envContent.includes("MELHOR_ENVIO_TOKEN=")) {
          envContent = envContent.replace(/MELHOR_ENVIO_TOKEN=.*/g, `MELHOR_ENVIO_TOKEN="${accessToken}"`);
        } else {
          envContent += `\nMELHOR_ENVIO_TOKEN="${accessToken}"\n`;
        }

        if (refreshToken) {
          if (envContent.includes("MELHOR_ENVIO_REFRESH_TOKEN=")) {
            envContent = envContent.replace(
              /MELHOR_ENVIO_REFRESH_TOKEN=.*/g,
              `MELHOR_ENVIO_REFRESH_TOKEN="${refreshToken}"`
            );
          } else {
            envContent += `MELHOR_ENVIO_REFRESH_TOKEN="${refreshToken}"\n`;
          }
        }
        fs.writeFileSync(envPath, envContent, "utf-8");
      }
      process.env.MELHOR_ENVIO_TOKEN = accessToken;
    } catch (fsErr) {
      console.warn("Não foi possível salvar automaticamente no .env:", fsErr);
    }

    // Realizar cotação de teste imediata com a API oficial do Melhor Envio
    const testResult = await calculateMelhorEnvioShipping({
      toCep: "01310-100",
      itemsCount: 1,
      subtotal: 79.90,
    });

    const optionsListHtml = testResult.options
      .map(
        (opt) =>
          `<li style="margin: 8px 0;"><strong>${opt.company.name} · ${opt.name}:</strong> R$ ${opt.price.toFixed(
            2
          )} (Prazo: ${opt.deliveryTime} dias úteis)</li>`
      )
      .join("");

    return new Response(
      `<!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Melhor Envio Conectado!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #09090b; padding: 40px 16px; display: flex; justify-content: center; }
          .card { max-width: 580px; width: 100%; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
          .badge { display: inline-block; background: #dcfce7; color: #166534; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; padding: 6px 12px; border-radius: 999px; margin-bottom: 16px; }
          h1 { font-size: 22px; font-weight: 800; margin: 0 0 10px; color: #09090b; }
          p { font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px; }
          .quote-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: left; }
          ul { margin: 12px 0; padding-left: 20px; font-size: 13px; color: #27272a; }
          .btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 20px; background: #09090b; color: #ffffff; font-weight: 700; font-size: 14px; border-radius: 12px; text-decoration: none; transition: opacity 0.2s; }
          .btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">INTEGRAÇÃO CONCLUÍDA</span>
          <h1>🎉 Melhor Envio Autorizado!</h1>
          <p>Seu <strong>Access Token</strong> foi gerado com sucesso e gravado no arquivo <code>.env</code> do projeto.</p>
          
          <div class="quote-box">
            <strong style="font-size: 13px; color: #09090b;">📦 Cotação de Teste em Tempo Real (CEP 01310-100):</strong>
            <ul>${optionsListHtml}</ul>
            <div style="margin-top: 10px; font-size: 11px; color: #71717a;">
              Origem da cotação: <strong>${testResult.isFallback ? "Simulação de Contingência" : "API Oficial do Melhor Envio (Sandbox)"}</strong>
            </div>
          </div>

          <a href="/checkout" class="btn">Testar no Checkout da Loja &rarr;</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Erro no callback do Melhor Envio:", err);
    return new Response(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #e11d48;">Erro Interno de Conexão</h2>
        <p>${err.message}</p>
        <a href="/api/shipping/authorize">Tentar novamente</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}
