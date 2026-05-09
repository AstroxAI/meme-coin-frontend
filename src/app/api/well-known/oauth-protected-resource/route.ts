import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/mcpAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const base = getBaseUrl(req);
  return NextResponse.json({
    resource: base,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
    scopes_supported: ["token_mint"],
  });
}
