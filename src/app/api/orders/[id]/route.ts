import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    if (isSupabaseConfigured()) {
      const { data: ord, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (!error && ord) {
        const formattedOrder = {
          id: ord.id,
          orderNumber: ord.order_number,
          customer: {
            name: ord.customer_name,
            email: ord.customer_email,
            whatsapp: ord.customer_whatsapp,
            cpf: ord.customer_cpf,
          },
          shippingAddress: ord.shipping_address,
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

        return NextResponse.json(formattedOrder);
      }
    }
  } catch (err) {
    console.error("Erro ao buscar pedido por ID no Supabase:", err);
  }

  return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
}
