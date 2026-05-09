import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { verifyNonce, issueCode } from "@/lib/mcpAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    const siwe = new SiweMessage(message);
    const result = await siwe.verify({ signature });
    if (!result.success) throw new Error("签名无效");

    if (!verifyNonce(result.data.nonce)) throw new Error("Nonce 无效或已过期");

    const code = issueCode(result.data.address);
    return NextResponse.json({ code });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
