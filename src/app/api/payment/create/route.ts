import { NextResponse } from "next/server";
import { Order } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  createAsaasPixPayment,
  createAsaasCardPayment,
  CardPaymentInput,
} from "@/lib/asaas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order, cardInput, type } = body as {
      order: Order;
      cardInput?: CardPaymentInput;
      type?: "pix" | "card";
    };

    if (!order || !order.id || !order.totalAmount || !order.customer) {
      return NextResponse.json(
        { error: "Dados do pedido incompletos para processamento de pagamento." },
        { status: 400 }
      );
    }

    // 1. Processamento de PIX via Asaas (QR Code & Copia e Cola)
    if (order.paymentMethod === "pix" || type === "pix") {
      const pixResult = await createAsaasPixPayment(order);

      const paymentDetails = {
        gateway: "asaas",
        asaasPaymentId: pixResult.paymentId,
        asaasStatus: pixResult.status,
        asaasStatusDetail: pixResult.statusDetail,
        // Compatibilidade retroativa
        mercadopagoPaymentId: pixResult.paymentId,
        mercadopagoStatus: pixResult.status,
        pixQrCode: pixResult.pixQrCode,
        pixQrCodeBase64: pixResult.pixQrCodeBase64,
        ticketUrl: pixResult.ticketUrl,
      };

      if (isSupabaseConfigured() && order.id && pixResult.success) {
        try {
          const { data: existing } = await supabase
            .from("orders")
            .select("id, shipping_address")
            .eq("id", order.id)
            .maybeSingle();

          if (existing) {
            const updatedShipping = {
              ...(existing.shipping_address || {}),
              paymentDetails,
            };
            await supabase
              .from("orders")
              .update({
                shipping_address: updatedShipping,
                payment_method: "pix",
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
        } catch (e) {
          console.warn("Aviso ao atualizar detalhes do PIX no Supabase:", e);
        }
      }

      return NextResponse.json({
        success: pixResult.success,
        paymentId: pixResult.paymentId,
        status: pixResult.status,
        statusDetail: pixResult.statusDetail,
        paymentMethod: "pix",
        paymentDetails,
        isSimulated: pixResult.isSimulated,
        error: pixResult.error,
      });
    }

    // 2. Processamento de Cartão de Crédito transparente via Asaas
    if (
      order.paymentMethod === "credit_card" ||
      order.paymentMethod === "debit_card" ||
      type === "card"
    ) {
      const cardResult = await createAsaasCardPayment(
        order,
        cardInput || {
          cardNumber: "",
          cardHolderName: "",
          expiry: "",
          cvv: "",
        }
      );

      const cardPaymentDetails = {
        gateway: "asaas",
        asaasPaymentId: cardResult.paymentId,
        asaasStatus: cardResult.status,
        asaasStatusDetail: cardResult.statusDetail,
        // Compatibilidade retroativa
        mercadopagoPaymentId: cardResult.paymentId,
        mercadopagoStatus: cardResult.status,
        cardBrand: cardResult.cardBrand,
        cardLastFour: cardResult.cardLastFour,
        installments: cardResult.installments,
        installmentAmount: cardResult.installmentAmount,
      };

      if (isSupabaseConfigured() && order.id && cardResult.status === "approved") {
        try {
          const { data: existing } = await supabase
            .from("orders")
            .select("id, shipping_address")
            .eq("id", order.id)
            .maybeSingle();

          if (existing) {
            const updatedShipping = {
              ...(existing.shipping_address || {}),
              paymentDetails: cardPaymentDetails,
            };
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status: "in_production",
                payment_method: "credit_card",
                shipping_address: updatedShipping,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
        } catch (e) {
          console.warn("Aviso ao atualizar pedido com cartão no Supabase:", e);
        }
      }

      return NextResponse.json({
        success: cardResult.success,
        paymentId: cardResult.paymentId,
        status: cardResult.status,
        statusDetail: cardResult.statusDetail,
        paymentMethod: "credit_card",
        paymentDetails: cardPaymentDetails,
        isSimulated: cardResult.isSimulated,
        error: cardResult.error,
      });
    }

    return NextResponse.json(
      { error: "Método de pagamento não suportado." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Erro na rota /api/payment/create:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento.", details: err?.message },
      { status: 500 }
    );
  }
}
