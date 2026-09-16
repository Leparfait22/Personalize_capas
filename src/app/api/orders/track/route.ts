import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Order } from "@/types";
import { getInitialDemoOrders } from "@/lib/storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("query") || "";

  const query = rawQuery.trim();

  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  const cleanDigits = query.replace(/\D/g, "");

  try {
    if (isSupabaseConfigured()) {
      let req = supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });

      // Busca por número do pedido, e-mail ou CPF
      if (cleanDigits.length >= 8) {
        req = req.or(`customer_cpf.ilike.%${cleanDigits}%,customer_email.ilike.%${query}%,order_number.ilike.%${query}%,id.eq.${query}`);
      } else {
        req = req.or(`order_number.ilike.%${query}%,customer_email.ilike.%${query}%,id.eq.${query}`);
      }

      const { data, error } = await req;

      if (!error && data && data.length > 0) {
        const formattedOrders: Order[] = data.map((ord: any) => ({
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
        }));

        return NextResponse.json(formattedOrders);
      }
    }
  } catch (err) {
    console.error("Erro ao buscar pedido por rastreamento no Supabase:", err);
  }

  // Fallback em memória para testes locais
  const demoOrders = getInitialDemoOrders();
  const qLower = query.toLowerCase();
  const matched = demoOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(qLower) ||
      o.customer.email.toLowerCase().includes(qLower) ||
      (cleanDigits.length >= 8 && o.customer.cpf.replace(/\D/g, "").includes(cleanDigits))
  );

  return NextResponse.json(matched);
}
