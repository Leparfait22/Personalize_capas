import { NextResponse } from "next/server";
import { Order } from "@/types";
import {
  createPixPayment,
  createCardPayment,
  createCheckoutPreference,
  CardPaymentInput,
} from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order, cardInput, type } = body as {
      order: Order;
      cardInput?: CardPaymentInput;
      type?: "pix" | "card" | "preference";
    };

    if (!order || !order.id || !order.totalAmount || !order.customer) {
      return NextResponse.json(
        { error: "Dados do pedido incompletos para processamento de pagamento." },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    // 1. Processamento de PIX (QR Code & Copia e Cola)
    if (order.paymentMethod === "pix" || type === "pix") {
      const pixResult = await createPixPayment(order, baseUrl);

      return NextResponse.json({
        success: pixResult.success,
        paymentId: pixResult.paymentId,
        status: pixResult.status,
        statusDetail: pixResult.statusDetail,
        paymentMethod: "pix",
        paymentDetails: {
          mercadopagoPaymentId: pixResult.paymentId,
          mercadopagoStatus: pixResult.status,
          mercadopagoStatusDetail: pixResult.statusDetail,
          pixQrCode: pixResult.pixQrCode,
          pixQrCodeBase64: pixResult.pixQrCodeBase64,
          ticketUrl: pixResult.ticketUrl,
        },
        isSimulated: pixResult.isSimulated,
      });
    }

    // 2. Processamento de Cartão de Crédito ou Cartão de Débito
    if (
      order.paymentMethod === "credit_card" ||
      order.paymentMethod === "debit_card" ||
      type === "card"
    ) {
      const isDebit = order.paymentMethod === "debit_card" || Boolean(cardInput?.isDebit);
      const cardResult = await createCardPayment(
        order,
        {
          ...(cardInput || {}),
          isDebit,
        },
        baseUrl
      );

      return NextResponse.json({
        success: cardResult.success,
        paymentId: cardResult.paymentId,
        status: cardResult.status,
        statusDetail: cardResult.statusDetail,
        paymentMethod: isDebit ? "debit_card" : "credit_card",
        paymentDetails: {
          mercadopagoPaymentId: cardResult.paymentId,
          mercadopagoStatus: cardResult.status,
          mercadopagoStatusDetail: cardResult.statusDetail,
          cardBrand: cardResult.cardBrand,
          cardLastFour: cardResult.cardLastFour,
          installments: cardResult.installments,
          installmentAmount: cardResult.installmentAmount,
        },
        isSimulated: cardResult.isSimulated,
        error: cardResult.error,
      });
    }

    // 3. Fallback: Preferência Mercado Pago (Checkout Pro)
    const preference = await createCheckoutPreference(order, baseUrl);
    if (preference) {
      return NextResponse.json({
        success: true,
        preferenceId: preference.id,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
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
