import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAsaasPayment } from "@/lib/asaas";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const resolved = await params;
  const orderId = resolved.orderId;

  if (!orderId) {
    return NextResponse.json({ error: "ID do pedido não informado" }, { status: 400 });
  }

  try {
    if (isSupabaseConfigured()) {
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, order_number, payment_status, status, shipping_address")
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .single();

      if (!error && order) {
        const paymentDetails = order.shipping_address?.paymentDetails;
        const asaasPaymentId = paymentDetails?.asaasPaymentId;
        const mpPaymentId = paymentDetails?.mercadopagoPaymentId;

        // 1. Checagem em tempo real via Asaas
        if (order.payment_status === "pending" && asaasPaymentId) {
          const asaasData = await fetchAsaasPayment(asaasPaymentId);
          if (
            asaasData &&
            (asaasData.status === "CONFIRMED" || asaasData.status === "RECEIVED")
          ) {
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status: order.status === "pending" ? "in_production" : order.status,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            return NextResponse.json({
              paid: true,
              paymentStatus: "paid",
              orderStatus: order.status === "pending" ? "in_production" : order.status,
              asaasStatus: asaasData.status,
              mercadopagoStatus: "approved",
            });
          }
        }

        // 2. Fallback de verificação retroativa para Mercado Pago (se o pedido for antigo)
        if (order.payment_status === "pending" && mpPaymentId && !asaasPaymentId) {
          const mpData = await fetchMercadoPagoPayment(mpPaymentId);
          if (mpData && mpData.status === "approved") {
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status: order.status === "pending" ? "in_production" : order.status,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            return NextResponse.json({
              paid: true,
              paymentStatus: "paid",
              orderStatus: order.status === "pending" ? "in_production" : order.status,
              mercadopagoStatus: "approved",
            });
          }
        }

        return NextResponse.json({
          paid: order.payment_status === "paid",
          paymentStatus: order.payment_status,
          orderStatus: order.status,
          paymentDetails,
        });
      }
    }

    return NextResponse.json({
      paid: false,
      paymentStatus: "pending",
      orderStatus: "pending",
    });
  } catch (err: any) {
    console.error("Erro ao verificar status do pagamento:", err);
    return NextResponse.json({ error: "Erro interno", details: err?.message }, { status: 500 });
  }
}
