import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        "Access-Control-Expose-Headers": "WWW-Authenticate",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  response.headers.set("Access-Control-Expose-Headers", "WWW-Authenticate");
  return response;
}

export const config = {
  matcher: ["/mcp", "/mcp/:path*", "/oauth/:path*", "/api/:path*"],
};
