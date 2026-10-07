import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { generateMelhorEnvioLabel } from "@/lib/melhor-envio";
import { Order } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔒 1. Validação de Acesso de Administrador
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem gerar etiquetas de envio." },
      { status: 403 }
    );
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    let order: Order | null = null;

    // Buscar dados do pedido
    if (isSupabaseConfigured()) {
      const { data: ord, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (!error && ord) {
        order = {
          id: ord.id,
          orderNumber: ord.order_number,
          customer: {
            name: ord.customer_name,
            email: ord.customer_email,
            whatsapp: ord.customer_whatsapp,
            cpf: ord.customer_cpf,
          },
          shippingAddress: ord.shipping_address,
          shippingMethod: ord.shipping_address?.shippingMethod || ord.shippingMethod,
          trackingCode: ord.shipping_address?.trackingCode || ord.trackingCode,
          labelUrl: ord.shipping_address?.labelUrl || ord.labelUrl,
          shipmentId: ord.shipping_address?.shipmentId || ord.shipmentId,
          items: (ord.order_items || []).map((item: any) => ({
            id: item.id,
            model: {
              id: item.model_id,
              name: item.model_name,
              brand: "Apple",
              basePrice: Number(item.unit_price),
              dimensionsMm: { width: 75, height: 155, thickness: 8 },
              aspectRatio: 0.48,
              cornerRadius: 14,
              cameraModule: { x: 6, y: 3.5, width: 42, height: 23, shape: "rounded-square" },
            },
            finish: {
              id: item.finish_id,
              name: item.finish_name,
              subtitle: "",
              description: "",
              priceAdd: 0,
              borderStyle: "heavy",
              features: [],
            },
            caseColor: item.case_color,
            customization: item.customization,
            previewMockupUrl: item.preview_mockup_url,
            highResPrintUrl: item.high_res_print_url,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            totalPrice: Number(item.total_price),
            createdAt: item.created_at,
          })),
          subtotal: Number(ord.subtotal),
          shippingCost: Number(ord.shipping_cost),
          discount: Number(ord.discount),
          totalAmount: Number(ord.total_amount),
          paymentMethod: ord.payment_method,
          paymentStatus: ord.payment_status,
          status: ord.status,
          createdAt: ord.created_at,
          updatedAt: ord.updated_at,
          notes: ord.notes,
        };
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    // 2. Chamar a API do Melhor Envio para gerar e pagar a etiqueta com o saldo
    const labelResult = await generateMelhorEnvioLabel(order);

    if (!labelResult.success) {
      return NextResponse.json(
        { error: labelResult.error || "Não foi possível gerar a etiqueta no Melhor Envio." },
        { status: 500 }
      );
    }

    // 3. Atualizar o pedido no banco de dados com a nova etiqueta e código de rastreio
    if (isSupabaseConfigured()) {
      const updatedShippingAddress = {
        ...order.shippingAddress,
        trackingCode: labelResult.trackingCode,
        labelUrl: labelResult.labelUrl,
        shipmentId: labelResult.shipmentId,
      };

      await supabase
        .from("orders")
        .update({
          shipping_address: updatedShippingAddress,
          status: order.status === "pending" ? "in_production" : order.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      shipmentId: labelResult.shipmentId,
      trackingCode: labelResult.trackingCode,
      labelUrl: labelResult.labelUrl,
      carrierName: labelResult.carrierName,
      serviceName: labelResult.serviceName,
      isSandbox: labelResult.isSandbox,
      price: labelResult.price,
    });
  } catch (error: any) {
    console.error("Erro na emissão de etiqueta:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao emitir etiqueta no Melhor Envio." },
      { status: 500 }
    );
  }
}
