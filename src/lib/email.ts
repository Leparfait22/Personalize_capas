import nodemailer from "nodemailer";

export interface TrackingEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingCode: string;
  carrierName?: string;
  serviceName?: string;
  items?: Array<{
    modelName: string;
    quantity: number;
  }>;
  shippingAddress?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const fromName = (process.env.SMTP_FROM_NAME || "SnapCase Estúdio").trim();
  const fromEmail = (process.env.SMTP_FROM_EMAIL || user || "contato@snapcasebr.com").trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    fromName,
    fromEmail,
    siteUrl,
  };
}

export function isSmtpConfigured(): boolean {
  const cfg = getSmtpConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass);
}

/**
 * Escapa caracteres especiais HTML para prevenir HTML Injection no corpo do e-mail
 */
export function escapeEmailHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Remove quebras de linha (\r, \n) para prevenir ataques de SMTP Header Injection (CRLF Injection)
 */
export function sanitizeSmtpHeader(value: unknown): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

const SAFE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Envia e-mail transacional com o código de rastreamento para o cliente via SMTP (Nodemailer).
 * Caso o SMTP ainda não esteja configurado no .env, registra log informativo sem interromper o fluxo.
 */
export async function sendTrackingEmail(
  payload: TrackingEmailPayload
): Promise<{ sent: boolean; simulated?: boolean; error?: string }> {
  const rawRecipient = String(payload.customerEmail || "").trim();
  // Bloqueia CRLF injection ou formato inválido de e-mail
  if (!rawRecipient || /[\r\n]/.test(rawRecipient) || !SAFE_EMAIL_REGEX.test(rawRecipient)) {
    return { sent: false, error: "E-mail do destinatário inválido ou ausente." };
  }
  const recipient = sanitizeSmtpHeader(rawRecipient);

  const cfg = getSmtpConfig();

  if (!isSmtpConfigured()) {
    console.info(
      `[SMTP Simulado] E-mail de rastreio (${sanitizeSmtpHeader(payload.trackingCode)}) para ${recipient} (Pedido ${sanitizeSmtpHeader(payload.orderNumber)}). Configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env para envio real.`
    );
    return { sent: false, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });

    const rawFirstName = (payload.customerName || "Cliente").trim().split(" ")[0];
    const firstName = escapeEmailHtml(rawFirstName);
    const safeOrderNumber = escapeEmailHtml(sanitizeSmtpHeader(payload.orderNumber));
    const safeTrackingCode = escapeEmailHtml(sanitizeSmtpHeader(payload.trackingCode));
    const carrierLabel = escapeEmailHtml(
      [payload.carrierName, payload.serviceName].filter(Boolean).join(" · ") || "Transportadora"
    );
    const orderUrl = `${cfg.siteUrl}/order-success/${encodeURIComponent(String(payload.orderId || ""))}`;
    const melhorRastreioUrl = payload.trackingCode
      ? `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(String(payload.trackingCode).trim())}`
      : orderUrl;

    const itemsHtml =
      payload.items && payload.items.length > 0
        ? `
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e4e4e7;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">
              Itens do Pedido
            </p>
            <ul style="margin: 0; padding-left: 18px; color: #18181b; font-size: 14px; line-height: 1.6;">
              ${payload.items
                .map(
                  (item) =>
                    `<li><strong>Capinha Personalizada - ${escapeEmailHtml(item.modelName)}</strong> (${Number(item.quantity) || 1}x)</li>`
                )
                .join("")}
            </ul>
          </div>
        `
        : "";

    const addressHtml = payload.shippingAddress?.street
      ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 13px; color: #52525b; line-height: 1.5;">
          <strong style="color: #18181b;">Endereço de entrega:</strong><br />
          ${escapeEmailHtml(payload.shippingAddress.street)}, ${escapeEmailHtml(payload.shippingAddress.number || "S/N")}${
          payload.shippingAddress.complement ? ` - ${escapeEmailHtml(payload.shippingAddress.complement)}` : ""
        }<br />
          ${payload.shippingAddress.neighborhood ? `${escapeEmailHtml(payload.shippingAddress.neighborhood)} - ` : ""}${
          escapeEmailHtml(payload.shippingAddress.city || "")
        }/${escapeEmailHtml(payload.shippingAddress.state || "")} · CEP ${escapeEmailHtml(payload.shippingAddress.zipCode || "")}
        </div>
      `
      : "";

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Rastreamento do seu Pedido ${safeOrderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
          <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
            <div style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
              <!-- Cabeçalho -->
              <div style="background-color: #09090b; color: #ffffff; padding: 24px 28px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.02em;">
                  SnapCase
                </h1>
                <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #a1a1aa;">
                  Estúdio de Capas
                </p>
              </div>

              <!-- Conteúdo -->
              <div style="padding: 28px;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #09090b;">
                  Olá, ${firstName}! 👋
                </p>
                <p style="margin: 0 0 20px; font-size: 14px; color: #52525b; line-height: 1.6;">
                  Temos ótimas notícias! Os dados de envio do seu pedido <strong>#${safeOrderNumber}</strong> já estão disponíveis para acompanhamento.
                </p>

                <!-- Card do Código de Rastreamento -->
                <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
                    Código de Rastreamento (${carrierLabel})
                  </p>
                  <p style="margin: 8px 0 16px; font-family: monospace; font-size: 20px; font-weight: 900; color: #09090b; letter-spacing: 0.06em;">
                    ${safeTrackingCode}
                  </p>

                  <div style="margin-top: 12px;">
                    <a
                      href="${orderUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 12px; margin: 4px;"
                    >
                      Acompanhar Pedido na Loja
                    </a>
                    <a
                      href="${melhorRastreioUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display: inline-block; background-color: #ffffff; color: #09090b; border: 1px solid #d4d4d8; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 20px; border-radius: 12px; margin: 4px;"
                    >
                      Rastrear na Transportadora
                    </a>
                  </div>
                </div>

                ${itemsHtml}
                ${addressHtml}
              </div>

              <!-- Rodapé -->
              <div style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 20px 28px; text-align: center; font-size: 12px; color: #71717a; line-height: 1.6;">
                <p style="margin: 0 0 6px; font-weight: 600; color: #18181b;">
                  Precisa de ajuda com seu pedido?
                </p>
                <p style="margin: 0;">
                  WhatsApp: <a href="https://wa.me/5521994948282" style="color: #09090b; font-weight: 600; text-decoration: none;">(21) 99494-8282</a> ·
                  E-mail: <a href="mailto:contato@snapcasebr.com" style="color: #09090b; font-weight: 600; text-decoration: none;">contato@snapcasebr.com</a> ·
                  Instagram: <a href="https://www.instagram.com/snapcasebrasil" style="color: #09090b; font-weight: 600; text-decoration: none;">@snapcasebrasil</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const cleanSubjectOrder = sanitizeSmtpHeader(payload.orderNumber);
    const text = [
      `Olá, ${sanitizeSmtpHeader(rawFirstName)}!`,
      ``,
      `Os dados de rastreamento do seu pedido #${cleanSubjectOrder} na SnapCase já estão disponíveis.`,
      `Transportadora: ${sanitizeSmtpHeader(payload.carrierName || "Transportadora")}`,
      `Código de Rastreamento: ${sanitizeSmtpHeader(payload.trackingCode)}`,
      ``,
      `Acompanhe seu pedido na loja: ${orderUrl}`,
      `Rastreie na transportadora: ${melhorRastreioUrl}`,
      ``,
      `Dúvidas? Fale conosco no WhatsApp (21) 99494-8282 ou contato@snapcasebr.com`,
    ].join("\n");

    const safeFromName = sanitizeSmtpHeader(cfg.fromName);
    const safeFromEmail = sanitizeSmtpHeader(cfg.fromEmail);
    const subjectLine = `Código de Rastreio do seu Pedido #${cleanSubjectOrder} 📦 - SnapCase`;

    try {
      await transporter.sendMail({
        from: `"${safeFromName}" <${safeFromEmail}>`,
        to: recipient,
        replyTo: safeFromEmail,
        subject: subjectLine,
        text,
        html,
      });
    } catch (firstErr: any) {
      // Caso o servidor SMTP exija que o remetente 'from' seja idêntico ao SMTP_USER principal (e o fromEmail seja um alias)
      if (safeFromEmail.toLowerCase() !== cfg.user.toLowerCase()) {
        await transporter.sendMail({
          from: `"${safeFromName}" <${sanitizeSmtpHeader(cfg.user)}>`,
          to: recipient,
          replyTo: safeFromEmail,
          subject: subjectLine,
          text,
          html,
        });
      } else {
        throw firstErr;
      }
    }

    return { sent: true };
  } catch (err: any) {
    console.error("Erro ao enviar e-mail de rastreamento via SMTP:", err);
    return {
      sent: false,
      error: err?.message || "Falha ao enviar e-mail via SMTP.",
    };
  }
}

