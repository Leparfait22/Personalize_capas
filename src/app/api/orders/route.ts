import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Order } from "@/types";
import { getInitialDemoOrders } from "@/lib/storage";
import { getServerSession } from "@/lib/auth-server";
import { uploadImageToStorage } from "@/lib/r2";
import { INITIAL_PHONE_MODELS, CASE_FINISHES } from "@/data/catalog";
import { sanitizeInput } from "@/lib/utils";

// In-memory fallback para desenvolvimento se Supabase ainda não estiver conectado
let inMemoryOrders: Order[] = getInitialDemoOrders();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = searchParams.get("query");
  const dateFilter = searchParams.get("dateFilter"); // yesterday | today | week | all

  // 🔒 Obter a sessão real validada pelo cookie HTTP-Only no Servidor
  const session = await getServerSession();

  // Se não houver sessão ativa no servidor, impede a listagem dos pedidos da loja
  if (!session) {
    return NextResponse.json([]);
  }

  const isUserAdmin = session.isAdmin;
  const userEmail = (session.email || "").trim().toLowerCase();

  try {
    if (isSupabaseConfigured()) {
      let req = supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });

      // 🛡️ Regra de Ouro da Segurança: Se NÃO for Admin, força o filtro apenas pelo e-mail autenticado!
      if (!isUserAdmin) {
        req = req.ilike("customer_email", userEmail);
      }

      if (status && status !== "all") {
        req = req.eq("status", status);
      }

      if (query) {
        req = req.or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_whatsapp.ilike.%${query}%`);
      }

      const { data, error } = await req;

      if (!error && data) {
        let formattedOrders: Order[] = data.map((ord: any) => ({
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
          paymentDetails: ord.shipping_address?.paymentDetails || ord.payment_details || undefined,
          status: ord.status,
          createdAt: ord.created_at,
          updatedAt: ord.updated_at,
          notes: ord.notes,
        }));

        // Filtrar por data no servidor/memória
        if (dateFilter && dateFilter !== "all") {
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterdayStart = new Date(todayStart);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);

          formattedOrders = formattedOrders.filter((ord) => {
            const ordDate = new Date(ord.createdAt);
            if (dateFilter === "today") return ordDate >= todayStart;
            if (dateFilter === "yesterday") return ordDate >= yesterdayStart && ordDate < todayStart;
            if (dateFilter === "week") {
              const weekAgo = new Date(todayStart);
              weekAgo.setDate(weekAgo.getDate() - 7);
              return ordDate >= weekAgo;
            }
            return true;
          });
        }

        return NextResponse.json(formattedOrders);
      }
    }
  } catch (err) {
    console.error("Erro ao carregar pedidos do Supabase. Utilizando dados locais:", err);
  }

  // Fallback para pedidos em memória (respeitando a segurança da sessão)
  let filtered = [...inMemoryOrders];

  if (!isUserAdmin) {
    filtered = filtered.filter((o) => o.customer.email.toLowerCase() === userEmail.toLowerCase());
  }

  if (status && status !== "all") {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.whatsapp.includes(q)
    );
  }

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  try {
    const order: Order = await request.json();

    if (!order.id || !order.customer || !order.items || order.items.length === 0) {
      return NextResponse.json({ error: "Dados do pedido incompletos" }, { status: 400 });
    }

    // 🔒 Sanitização Server-side dos Dados do Cliente
    order.customer.name = sanitizeInput(order.customer.name || "");
    order.customer.email = (order.customer.email || "").trim().toLowerCase();
    order.customer.whatsapp = (order.customer.whatsapp || "").replace(/\D/g, "");
    order.customer.cpf = (order.customer.cpf || "").replace(/\D/g, "");

    if (order.notes) {
      order.notes = sanitizeInput(order.notes);
    }

    if (order.shippingAddress) {
      order.shippingAddress.street = sanitizeInput(order.shippingAddress.street || "");
      order.shippingAddress.neighborhood = sanitizeInput(order.shippingAddress.neighborhood || "");
      order.shippingAddress.city = sanitizeInput(order.shippingAddress.city || "");
      order.shippingAddress.state = sanitizeInput(order.shippingAddress.state || "");
      if (order.shippingAddress.complement) {
        order.shippingAddress.complement = sanitizeInput(order.shippingAddress.complement);
      }
    }

    // 🔒 Recálculo e Validação de Preços no Servidor (Prevenção de Adulteração de Preço)
    let calculatedSubtotal = 0;
    for (const item of order.items) {
      const catalogModel = INITIAL_PHONE_MODELS.find((m) => m.id === item.model.id);
      const catalogFinish = CASE_FINISHES.find((f) => f.id === item.finish.id);

      const basePrice = catalogModel ? catalogModel.basePrice : (item.model.basePrice || 79.90);
      const priceAdd = catalogFinish ? catalogFinish.priceAdd : (item.finish.priceAdd || 0);

      const realUnitPrice = Number((basePrice + priceAdd).toFixed(2));
      const realTotalPrice = Number((realUnitPrice * item.quantity).toFixed(2));

      item.unitPrice = realUnitPrice;
      item.totalPrice = realTotalPrice;
      calculatedSubtotal += realTotalPrice;
    }

    order.subtotal = Number(calculatedSubtotal.toFixed(2));
    const shipping = Number((order.shippingCost || 0).toFixed(2));
    const discount = Number((order.discount || 0).toFixed(2));
    order.totalAmount = Number(Math.max(0, order.subtotal + shipping - discount).toFixed(2));

    // Processar uploads de imagem para o Cloudflare R2 antes de gravar
    for (const item of order.items) {
      // 1. Upload da Foto Original enviada pelo cliente
      if (item.customization?.imageUrl && item.customization.imageUrl.startsWith("data:image/")) {
        try {
          const match = item.customization.imageUrl.match(/^data:(.+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const buffer = Buffer.from(match[2], "base64");
            const fileName = `original_${order.orderNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`;
            item.customization.imageUrl = await uploadImageToStorage(buffer, fileName, mimeType);
          }
        } catch (err) {
          console.error("Erro ao subir foto original para R2:", err);
        }
      }

      // 2. Upload do Mockup de visualização
      if (item.previewMockupUrl && item.previewMockupUrl.startsWith("data:image/")) {
        try {
          const match = item.previewMockupUrl.match(/^data:(.+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const buffer = Buffer.from(match[2], "base64");
            const fileName = `mockup_${order.orderNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`;
            item.previewMockupUrl = await uploadImageToStorage(buffer, fileName, mimeType);
          }
        } catch (err) {
          console.error("Erro ao subir mockup para R2:", err);
        }
      }

      // 3. Upload da Arte de Impressão (300 DPI)
      if (item.highResPrintUrl && item.highResPrintUrl.startsWith("data:image/")) {
        try {
          const match = item.highResPrintUrl.match(/^data:(.+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const buffer = Buffer.from(match[2], "base64");
            const fileName = `print_300dpi_${order.orderNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`;
            item.highResPrintUrl = await uploadImageToStorage(buffer, fileName, mimeType);
          }
        } catch (err) {
          console.error("Erro ao subir arte alta res para R2:", err);
        }
      }
    }

    if (isSupabaseConfigured()) {
      // 1. Inserir Pedido Principal
      const { error: orderError } = await supabase.from("orders").insert({
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customer.name,
        customer_email: order.customer.email,
        customer_whatsapp: order.customer.whatsapp,
        customer_cpf: order.customer.cpf,
        shipping_address: {
          ...order.shippingAddress,
          shippingMethod: order.shippingMethod || null,
          trackingCode: order.trackingCode || null,
          paymentDetails: order.paymentDetails || null,
        },
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        discount: order.discount,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        status: order.status,
        notes: order.notes || null,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
      });

      if (orderError) {
        console.error("Erro ao salvar pedido no Supabase:", orderError);
        return NextResponse.json({ error: orderError.message }, { status: 500 });
      }

      // 2. Inserir Itens do Pedido
      const itemsToInsert = order.items.map((item) => ({
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        order_id: order.id,
        model_id: item.model.id,
        model_name: item.model.name,
        finish_id: item.finish.id,
        finish_name: item.finish.name,
        case_color: item.caseColor,
        customization: item.customization,
        preview_mockup_url: item.previewMockupUrl,
        high_res_print_url: item.highResPrintUrl,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

      if (itemsError) {
        console.error("Erro ao salvar itens do pedido no Supabase:", itemsError);
      }
    }

    // Salvar também em memória para fallback gracioso
    inMemoryOrders = [order, ...inMemoryOrders];

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Erro no processamento do pedido:", err);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
