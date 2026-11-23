import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";
import { COMBINED_LOG_PATH, ERROR_LOG_PATH } from "@/lib/logger";
import fs from "fs";

export const dynamic = "force-dynamic";

function readTailLines(filePath: string, maxLines: number = 100): string[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    return lines.slice(-maxLines).reverse();
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem consultar os logs do sistema." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "error" ? "error" : "combined";
  const limit = Math.min(500, Math.max(10, Number(searchParams.get("limit")) || 100));

  const targetFile = type === "error" ? ERROR_LOG_PATH : COMBINED_LOG_PATH;
  const lines = readTailLines(targetFile, limit);

  return NextResponse.json(
    {
      success: true,
      type,
      count: lines.length,
      lines,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

