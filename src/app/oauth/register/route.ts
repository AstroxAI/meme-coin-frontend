import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      client_id: randomBytes(16).toString("hex"),
      client_secret: randomBytes(16).toString("hex"),
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  );
}
