import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Responde a requisições GET para validação de integridade e checagens de status
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Melhor Envio Webhook",
    message: "Endpoint de webhook ativo e pronto para receber notificações.",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Responde a requisições HEAD (usadas por alguns validadores de webhook para ping rápido)
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}

/**
 * Recebe as notificações de eventos de envio do Melhor Envio (POST)
 * Eventos comuns: order.posted (postado), order.delivered (entregue), order.cancelled (cancelado)
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // O Melhor Envio pode enviar requisição de teste sem body ou vazio
      return NextResponse.json(
        { status: "ok", message: "Ping de teste recebido com sucesso." },
        { status: 200 }
      );
    }

    console.log("[Melhor Envio Webhook] Notificação recebida:", JSON.stringify(body));

    // Se for validação de teste do painel do Melhor Envio
    if (!body || Object.keys(body).length === 0 || body.event === "test" || body.type === "ping") {
      return NextResponse.json({
        status: "ok",
        message: "Webhook do Melhor Envio validado com sucesso.",
      });
    }

    const event = body.event || body.type || body.action;
    const orderData = body.data || body.order || body;
    const trackingCode = orderData?.tracking || orderData?.tracking_code || orderData?.id;

    // Se houver banco configurado, atualizar o status do pedido
    if (isSupabaseConfigured() && trackingCode) {
      // Busca pedido que contenha este código de rastreio ou id de envio
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, notes")
        .or(`notes.ilike.%${trackingCode}%`);

      if (orders && orders.length > 0) {
        for (const order of orders) {
          let newStatus = order.status;

          // Evento de postagem (quando o lojista despachou o pacote na agência)
          if (event === "order.posted" || event === "shipment.posted" || event === "posted") {
            newStatus = "shipped";
          }
          // Evento de entrega realizada ao cliente final
          else if (event === "order.delivered" || event === "shipment.delivered" || event === "delivered") {
            newStatus = "completed";
          }

          if (newStatus !== order.status) {
            await supabase
              .from("orders")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            console.log(
              `[Melhor Envio Webhook] Pedido ${order.id} atualizado para '${newStatus}' via evento '${event}'.`
            );
          }
        }
      }
    }

    // Sempre responder 200 OK para confirmar o recebimento e não gerar retentativas
    return NextResponse.json({ status: "ok", received: true });
  } catch (err: any) {
    console.error("[Melhor Envio Webhook] Erro ao processar webhook:", err);
    // Retorna 200 mesmo em caso de erro interno para evitar bloqueio da fila pelo Melhor Envio
    return NextResponse.json({ status: "error", message: "Erro interno, mas notificação capturada." }, { status: 200 });
  }
}
