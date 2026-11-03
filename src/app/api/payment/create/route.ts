import { NextResponse } from "next/server";
import { Order } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  createAsaasPixPayment,
  createAsaasCardPayment,
  CardPaymentInput,
} from "@/lib/asaas";

// 🔒 Trava de concorrência em memória para evitar cobranças duplicadas simultâneas no mesmo pedido
const inFlightPaymentRequests = new Map<string, Promise<any>>();

// 🛡️ Cache de idempotência em memória (protege contra rajadas rápidas e ambientes sem banco externo)
const processedPaymentsMemory = new Map<
  string,
  {
    paymentStatus: "pending" | "paid";
    totalAmount?: number;
    pixDetails?: any;
    cardDetails?: any;
  }
>();

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

    const isPix = order.paymentMethod === "pix" || type === "pix";
    const lockKey = `${order.id}:${isPix ? "pix" : "card"}`;

    // Se já houver uma requisição idêntica em andamento para este pedido, aguarda o resultado dela
    if (inFlightPaymentRequests.has(lockKey)) {
      const sharedResult = await inFlightPaymentRequests.get(lockKey);
      return NextResponse.json(sharedResult.payload, { status: sharedResult.status });
    }

    const processPromise = (async (): Promise<{ payload: any; status: number }> => {
      const memState = processedPaymentsMemory.get(order.id);
      if (memState?.paymentStatus === "paid") {
        const details = memState.cardDetails || memState.pixDetails || {};
        return {
          status: 200,
          payload: {
            success: true,
            alreadyPaid: true,
            idempotent: true,
            paymentId: details.asaasPaymentId || details.mercadopagoPaymentId || "",
            status: "approved",
            statusDetail: "Pedido já se encontra pago.",
            paymentMethod: isPix ? "pix" : "credit_card",
            paymentDetails: details,
          },
        };
      }

      if (isPix && memState?.pixDetails?.pixQrCode && memState?.pixDetails?.asaasPaymentId) {
        return {
          status: 200,
          payload: {
            success: true,
            idempotent: true,
            paymentId: memState.pixDetails.asaasPaymentId,
            status: memState.pixDetails.asaasStatus || "pending",
            statusDetail: memState.pixDetails.asaasStatusDetail || "Aguardando pagamento via PIX",
            paymentMethod: "pix",
            paymentDetails: memState.pixDetails,
          },
        };
      }

      // 🛡️ Idempotência e validação de preço no banco de dados antes de chamar o Asaas
      let existingOrderRow: any = null;
      if (isSupabaseConfigured() && order.id) {
        const { data: existing } = await supabase
          .from("orders")
          .select("id, total_amount, payment_status, status, shipping_address")
          .eq("id", order.id)
          .maybeSingle();

        if (existing) {
          existingOrderRow = existing;
          // Usa sempre o total_amount validado pelo servidor no banco de dados
          if (Number(existing.total_amount) > 0) {
            order.totalAmount = Number(existing.total_amount);
          }

          // 1. Se o pedido já consta como PAGO no banco, impede nova cobrança!
          if (existing.payment_status === "paid") {
            const existingDetails = existing.shipping_address?.paymentDetails || {};
            return {
              status: 200,
              payload: {
                success: true,
                alreadyPaid: true,
                idempotent: true,
                paymentId: existingDetails.asaasPaymentId || existingDetails.mercadopagoPaymentId || "",
                status: "approved",
                statusDetail: "Pedido já se encontra pago.",
                paymentMethod: isPix ? "pix" : "credit_card",
                paymentDetails: existingDetails,
              },
            };
          }

          // 2. Se for PIX e já houver um QR Code gerado para este pedido, reutiliza sem criar duplicata no Asaas
          const existingDetails = existing.shipping_address?.paymentDetails;
          if (isPix && existingDetails?.pixQrCode && existingDetails?.asaasPaymentId) {
            return {
              status: 200,
              payload: {
                success: true,
                idempotent: true,
                paymentId: existingDetails.asaasPaymentId,
                status: existingDetails.asaasStatus || "pending",
                statusDetail: existingDetails.asaasStatusDetail || "Aguardando pagamento via PIX",
                paymentMethod: "pix",
                paymentDetails: existingDetails,
              },
            };
          }
        }
      }

      // 1. Processamento de PIX via Asaas (QR Code & Copia e Cola)
      if (isPix) {
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

        if (pixResult.success) {
          processedPaymentsMemory.set(order.id, {
            paymentStatus: "pending",
            totalAmount: order.totalAmount,
            pixDetails: paymentDetails,
          });
        }

        if (isSupabaseConfigured() && order.id && pixResult.success) {
          try {
            const currentShipping = existingOrderRow?.shipping_address || {};
            const updatedShipping = {
              ...currentShipping,
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
          } catch (e) {
            console.warn("Aviso ao atualizar detalhes do PIX no Supabase:", e);
          }
        }

        return {
          status: 200,
          payload: {
            success: pixResult.success,
            paymentId: pixResult.paymentId,
            status: pixResult.status,
            statusDetail: pixResult.statusDetail,
            paymentMethod: "pix",
            paymentDetails,
            isSimulated: pixResult.isSimulated,
            error: pixResult.error,
          },
        };
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

        if (cardResult.status === "approved") {
          processedPaymentsMemory.set(order.id, {
            paymentStatus: "paid",
            totalAmount: order.totalAmount,
            cardDetails: cardPaymentDetails,
            pixDetails: memState?.pixDetails,
          });
        }

        if (isSupabaseConfigured() && order.id && cardResult.status === "approved") {
          try {
            const currentShipping = existingOrderRow?.shipping_address || {};
            const updatedShipping = {
              ...currentShipping,
              paymentDetails: cardPaymentDetails,
            };
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status:
                  existingOrderRow && existingOrderRow.status !== "pending"
                    ? existingOrderRow.status
                    : "in_production",
                payment_method: "credit_card",
                shipping_address: updatedShipping,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          } catch (e) {
            console.warn("Aviso ao atualizar pedido com cartão no Supabase:", e);
          }
        }

        return {
          status: 200,
          payload: {
            success: cardResult.success,
            paymentId: cardResult.paymentId,
            status: cardResult.status,
            statusDetail: cardResult.statusDetail,
            paymentMethod: "credit_card",
            paymentDetails: cardPaymentDetails,
            isSimulated: cardResult.isSimulated,
            error: cardResult.error,
          },
        };
      }

      return {
        status: 400,
        payload: { error: "Método de pagamento não suportado." },
      };
    })();

    inFlightPaymentRequests.set(lockKey, processPromise);
    try {
      const result = await processPromise;
      return NextResponse.json(result.payload, { status: result.status });
    } finally {
      inFlightPaymentRequests.delete(lockKey);
    }
  } catch (err: any) {
    console.error("Erro na rota /api/payment/create:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento.", details: err?.message },
      { status: 500 }
    );
  }
}
