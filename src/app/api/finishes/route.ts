import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CASE_FINISHES } from "@/data/catalog";
import { CaseFinish } from "@/types";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("case_finishes")
        .select("*");

      if (!error && data && data.length > 0) {
        const formatted: CaseFinish[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          subtitle: item.subtitle,
          description: item.description,
          priceAdd: Number(item.price_add),
          badge: item.badge,
          popularBadge: item.popular_badge,
          borderStyle: item.border_style,
          features: item.features,
        }));
        return NextResponse.json(formatted);
      }
    }
  } catch (err) {
    console.error("Erro ao carregar acabamentos do Supabase:", err);
  }

  return NextResponse.json(CASE_FINISHES);
}
