import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "snapcase_admin_session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } catch (e) {
    // Fora do contexto de requisição do Next.js (ex: durante testes)
  }
  return NextResponse.json({ success: true });
}
