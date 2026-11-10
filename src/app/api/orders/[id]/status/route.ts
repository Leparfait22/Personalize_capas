import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isServerAdmin } from "@/lib/auth-server";
import { sendTrackingEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔒 Proteção Server-Side: Apenas administradores/lojistas autenticados podem alterar status de pedidos
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem alterar o status de pedidos." },
      { status: 403 }
    );
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const body = await request.json();
    const { status, paymentStatus, notes } = body;

    let emailSent = false;

    if (isSupabaseConfigured()) {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (status) updates.status = status;
      if (paymentStatus) updates.payment_status = paymentStatus;
      if (notes !== undefined) updates.notes = notes;

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar status do pedido no Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Se o status mudou para "shipped" (Enviado), envia o e-mail de rastreamento caso ainda não tenha sido enviado
      if (status === "shipped") {
        const { data: ord } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", id)
          .maybeSingle();

        const trackingCode = ord?.shipping_address?.trackingCode || ord?.tracking_code;
        const alreadySent = Boolean(ord?.shipping_address?.trackingEmailSentAt);

        if (ord && trackingCode && ord.customer_email && !alreadySent) {
          const emailRes = await sendTrackingEmail({
            orderId: ord.id,
            orderNumber: ord.order_number,
            customerName: ord.customer_name,
            customerEmail: ord.customer_email,
            trackingCode,
            carrierName: ord.shipping_address?.shippingMethod?.company,
            serviceName: ord.shipping_address?.shippingMethod?.name,
            items: (ord.order_items || []).map((item: any) => ({
              modelName: item.model_name,
              quantity: item.quantity,
            })),
            shippingAddress: ord.shipping_address,
          });

          if (emailRes.sent) {
            emailSent = true;
            await supabase
              .from("orders")
              .update({
                shipping_address: {
                  ...(ord.shipping_address || {}),
                  trackingEmailSentAt: new Date().toISOString(),
                },
              })
              .eq("id", id);
          }
        }
      }
    }

    return NextResponse.json({ success: true, id, status, paymentStatus, emailSent });
  } catch (err) {
    console.error("Erro ao atualizar pedido:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
