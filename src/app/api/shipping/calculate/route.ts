import { NextResponse } from "next/server";
import { calculateMelhorEnvioShipping, isValidCep, cleanCep } from "@/lib/melhor-envio";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toCep, itemsCount = 1, subtotal = 0, fromCep } = body;

    if (!toCep || typeof toCep !== "string") {
      return NextResponse.json(
        { error: "O CEP de destino é obrigatório." },
        { status: 400 }
      );
    }

    const cleanedCep = cleanCep(toCep);
    if (!isValidCep(cleanedCep)) {
      return NextResponse.json(
        { error: "Formato de CEP inválido. Por favor, informe um CEP válido com 8 dígitos." },
        { status: 400 }
      );
    }

    const safeItemsCount = Math.max(1, Number(itemsCount) || 1);
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);

    const result = await calculateMelhorEnvioShipping({
      toCep: cleanedCep,
      itemsCount: safeItemsCount,
      subtotal: safeSubtotal,
      fromCep,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Não foi possível calcular o frete para este CEP." },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na rota de cálculo de frete:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a cotação de frete." },
      { status: 500 }
    );
  }
}
