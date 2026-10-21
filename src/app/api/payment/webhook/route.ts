import { NextResponse } from "next/server";
import {
  fetchMercadoPagoPayment,
  validateWebhookSignature,
} from "@/lib/mercadopago";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Header de validação de assinatura Mercado Pago
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Alguns webhooks do Mercado Pago enviam apenas query params
    }

    // Identificar o ID do pagamento
    const paymentId =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      body?.data?.id ||
      body?.id;

    const topic = searchParams.get("type") || searchParams.get("topic") || body?.type || body?.action;

    // Validar assinatura (se a chave secreta estiver configurada)
    if (xSignature && xRequestId && paymentId) {
      const isValid = validateWebhookSignature(xSignature, xRequestId, String(paymentId));
      if (!isValid) {
        console.warn("Assinatura de Webhook do Mercado Pago inválida.");
        return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
      }
    }

    // Se o webhook for de pagamento, consulta os detalhes oficiais na API do Mercado Pago
    if (paymentId && (topic === "payment" || !topic || topic.includes("payment"))) {
      const paymentData = await fetchMercadoPagoPayment(paymentId);

      if (paymentData) {
        const orderId = (paymentData as any).external_reference;
        const paymentStatus = paymentData.status; // approved, pending, in_process, rejected, refunded

        console.log(`[Mercado Pago Webhook] Pagamento ID: ${paymentId} | Status: ${paymentStatus} | Pedido: ${orderId}`);

        if (orderId && isSupabaseConfigured()) {
          const isPaid = paymentStatus === "approved";

          // Buscar pedido para atualizar
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
                mercadopagoPaymentId: paymentId,
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

            console.log(`[Mercado Pago Webhook] Pedido ${existingOrder.id} atualizado com sucesso para: ${isPaid ? "PAID" : paymentStatus}`);
          }
        }
      }
    }

    // Sempre responder 200 OK para o Mercado Pago não reenviar a notificação repetidamente
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Erro ao processar Webhook do Mercado Pago:", err);
    // Retorna 200 para evitar que o Mercado Pago considere a rota offline
    return NextResponse.json({ received: true, error: err?.message }, { status: 200 });
  }
}
