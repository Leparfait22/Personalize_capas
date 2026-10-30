import { NextResponse } from "next/server";
import { validateAsaasWebhookToken } from "@/lib/asaas";
import {
  fetchMercadoPagoPayment,
  validateWebhookSignature,
} from "@/lib/mercadopago";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Payment Webhook (Asaas / Mercado Pago)",
    timestamp: new Date().toISOString(),
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Header do Asaas
    const asaasTokenHeader = request.headers.get("asaas-access-token");

    // Headers do Mercado Pago (legado)
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Alguns webhooks podem enviar body vazio ou parâmetros em query
    }

    // =========================================================================
    // 1. TRATAMENTO DO WEBHOOK DO ASAAS (PRIMÁRIO)
    // =========================================================================
    if (body?.event || asaasTokenHeader || body?.payment) {
      if (!validateAsaasWebhookToken(asaasTokenHeader)) {
        console.warn("Assinatura de Webhook do Asaas inválida.");
        return NextResponse.json({ error: "Token de webhook do Asaas inválido." }, { status: 401 });
      }

      const event = body?.event;
      const payment = body?.payment;
      const paymentId = payment?.id;
      const orderId = payment?.externalReference;
      const status = payment?.status; // RECEIVED, CONFIRMED, PENDING, OVERDUE, REFUNDED

      console.log(`[Asaas Webhook] Evento: ${event} | Pagamento ID: ${paymentId} | Status: ${status} | Pedido: ${orderId}`);

      const isPaid =
        event === "PAYMENT_RECEIVED" ||
        event === "PAYMENT_CONFIRMED" ||
        status === "RECEIVED" ||
        status === "CONFIRMED";

      if (orderId && isSupabaseConfigured()) {
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id, status, payment_status, shipping_address")
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .single();

        if (existingOrder) {
          const nextOrderStatus =
            isPaid && existingOrder.status === "pending"
              ? "in_production"
              : existingOrder.status;

          const updatedShippingAddress = {
            ...(existingOrder.shipping_address || {}),
            paymentDetails: {
              ...(existingOrder.shipping_address?.paymentDetails || {}),
              gateway: "asaas",
              asaasPaymentId: paymentId,
              asaasStatus: status,
              paidAt: isPaid ? new Date().toISOString() : undefined,
            },
          };

          await supabase
            .from("orders")
            .update({
              payment_status: isPaid ? "paid" : existingOrder.payment_status,
              status: nextOrderStatus,
              shipping_address: updatedShippingAddress,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingOrder.id);

          console.log(`[Asaas Webhook] Pedido ${existingOrder.id} atualizado para: ${isPaid ? "PAID" : status}`);
        }
      }

      return NextResponse.json({ received: true, gateway: "asaas" });
    }

    // =========================================================================
    // 2. TRATAMENTO DO WEBHOOK DO MERCADO PAGO (COMPATIBILIDADE LEGADA)
    // =========================================================================
    const mpPaymentId =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      body?.data?.id ||
      body?.id;

    const topic = searchParams.get("type") || searchParams.get("topic") || body?.type || body?.action;

    if (xSignature && xRequestId && mpPaymentId) {
      const isValid = validateWebhookSignature(xSignature, xRequestId, String(mpPaymentId));
      if (!isValid) {
        console.warn("Assinatura de Webhook do Mercado Pago inválida.");
        return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
      }
    }

    if (mpPaymentId && (topic === "payment" || !topic || String(topic).includes("payment"))) {
      const paymentData = await fetchMercadoPagoPayment(mpPaymentId);

      if (paymentData) {
        const orderId = (paymentData as any).external_reference;
        const paymentStatus = paymentData.status;

        if (orderId && isSupabaseConfigured()) {
          const isPaid = paymentStatus === "approved";

          const { data: existingOrder } = await supabase
            .from("orders")
            .select("id, status, payment_status, shipping_address")
            .or(`id.eq.${orderId},order_number.eq.${orderId}`)
            .single();

          if (existingOrder) {
            const nextOrderStatus =
              isPaid && existingOrder.status === "pending"
                ? "in_production"
                : existingOrder.status;

            const updatedShippingAddress = {
              ...(existingOrder.shipping_address || {}),
              paymentDetails: {
                ...(existingOrder.shipping_address?.paymentDetails || {}),
                mercadopagoPaymentId: mpPaymentId,
                mercadopagoStatus: paymentStatus,
                mercadopagoStatusDetail: paymentData.status_detail,
                paidAt: isPaid ? new Date().toISOString() : undefined,
              },
            };

            await supabase
              .from("orders")
              .update({
                payment_status: isPaid ? "paid" : existingOrder.payment_status,
                status: nextOrderStatus,
                shipping_address: updatedShippingAddress,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingOrder.id);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Erro ao processar Webhook:", err);
    return NextResponse.json({ received: true, error: err?.message }, { status: 200 });
  }
}
