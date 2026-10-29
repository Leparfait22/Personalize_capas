import { NextResponse } from "next/server";
import { Order } from "@/types";
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

      return NextResponse.json({
        success: pixResult.success,
        paymentId: pixResult.paymentId,
        status: pixResult.status,
        statusDetail: pixResult.statusDetail,
        paymentMethod: "pix",
        paymentDetails: {
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
        },
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

      return NextResponse.json({
        success: cardResult.success,
        paymentId: cardResult.paymentId,
        status: cardResult.status,
        statusDetail: cardResult.statusDetail,
        paymentMethod: "credit_card",
        paymentDetails: {
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
        },
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
