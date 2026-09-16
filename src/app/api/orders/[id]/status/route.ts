import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isServerAdmin } from "@/lib/auth-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔒 Proteção Server-Side: Apenas administradores/lojistas autenticados podem alterar status de pedidos
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem alterar o status de pedidos." },
      { status: 403 }
    );
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const body = await request.json();
    const { status, paymentStatus, notes } = body;

    if (isSupabaseConfigured()) {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (status) updates.status = status;
      if (paymentStatus) updates.payment_status = paymentStatus;
      if (notes !== undefined) updates.notes = notes;

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar status do pedido no Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id, status, paymentStatus });
  } catch (err) {
    console.error("Erro ao atualizar pedido:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
