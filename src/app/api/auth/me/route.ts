import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "snapcase_admin_session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false, isAdmin: false, userEmail: null });
    }

    let sessionData: any = null;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    }

    if (!sessionData) {
      return NextResponse.json({ authenticated: false, isAdmin: false, userEmail: null, userName: null });
    }

    return NextResponse.json({
      authenticated: true,
      isAdmin: sessionData.isAdmin || false,
      userEmail: sessionData.email || null,
      userName: sessionData.name || null,
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, isAdmin: false, userEmail: null, userName: null });
  }
}
