import { NextRequest, NextResponse } from "next/server";
import { redeemCode, issueToken } from "@/lib/mcpAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let code: string;
  let grant_type: string;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    code = params.get("code") || "";
    grant_type = params.get("grant_type") || "";
  } else {
    const body = await req.json();
    code = body.code || "";
    grant_type = body.grant_type || "";
  }

  if (grant_type !== "authorization_code") {
    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 }
    );
  }

  try {
    const address = redeemCode(code);
    const token = issueToken(address);
    return NextResponse.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: 2592000,
      scope: "token_mint",
    });
  } catch {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }
}
