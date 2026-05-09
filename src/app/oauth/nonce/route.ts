import { NextResponse } from "next/server";
import { generateNonce } from "@/lib/mcpAuth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ nonce: generateNonce() });
}
