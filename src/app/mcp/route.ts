import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken, relayerGet, relayerPost, getBaseUrl } from "@/lib/mcpAuth";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Access-Control-Expose-Headers": "WWW-Authenticate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function unauthorized(base: string) {
  return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const base = getBaseUrl(req);
  try {
    verifyBearerToken(req.headers.get("authorization"));
  } catch {
    return unauthorized(base);
  }
  return new NextResponse(": mcp server\n\n", {
    headers: { "Content-Type": "text/event-stream" },
  });
}

export async function POST(req: NextRequest) {
  const base = getBaseUrl(req);
  let walletAddress: string;
  try {
    walletAddress = verifyBearerToken(req.headers.get("authorization"));
  } catch {
    return unauthorized(base);
  }

  const body = await req.json();

  // JSON-RPC notification (no id) — no response needed
  if (body.id === undefined || body.id === null) {
    return new NextResponse(null, { status: 202 });
  }

  const { method, params, id } = body;

  try {
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "meme-coin-mcp", version: "1.0.0" },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "check_status",
              description: "查看当前用户的代币余额、存款余额，以及代币总体状态",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "mint_token",
              description: `用预存的 BNB 为 ${walletAddress} 铸造 Meme 代币。需要先提供 EIP-712 签名。`,
              inputSchema: {
                type: "object",
                properties: {
                  signature: {
                    type: "string",
                    description: "用户签名的 EIP-712 授权（0x 开头）",
                  },
                },
                required: ["signature"],
              },
            },
          ],
        },
      });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === "check_status") {
        const [user, global] = await Promise.all([
          relayerGet(`/user/${walletAddress}`),
          relayerGet("/status"),
        ]);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text:
                  `👤 ${walletAddress}\n` +
                  `• 代币余额：${user.balance} 枚\n` +
                  `• 已存 BNB：${user.deposit}\n` +
                  `• 可以 Mint：${user.canMint ? "✅ 是" : "❌ 否（请先在网站存入 BNB）"}\n\n` +
                  `📊 代币状态\n` +
                  `• 已发行：${global.totalSupply} 枚 / ${global.maxSupply} 枚\n` +
                  `• Mint 价格：${global.mintPrice}`,
              },
            ],
          },
        });
      }

      if (toolName === "mint_token") {
        const { signature } = args as { signature: string };
        const data = await relayerPost("/mint", {
          address: walletAddress,
          signature,
        });
        if (data.error) throw new Error(data.error);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text:
                  `✅ Mint 成功！\n` +
                  `• 交易哈希：${data.txHash}\n` +
                  `• 查看：https://testnet.bscscan.com/tx/${data.txHash}`,
              },
            ],
          },
        });
      }

      throw new Error(`未知工具：${toolName}`);
    }

    // Unknown method
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Method not found" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "internal error";
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: `❌ ${msg}` }],
        isError: true,
      },
    });
  }
}
