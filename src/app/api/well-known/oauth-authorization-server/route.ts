import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/mcpAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const base = getBaseUrl(req);
  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["token_mint"],
  });
}
