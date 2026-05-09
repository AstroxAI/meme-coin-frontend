import { NextRequest, NextResponse } from "next/server";
import { generateNonce, getBaseUrl } from "@/lib/mcpAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirect_uri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const client_id = searchParams.get("client_id") || "";
  const base = getBaseUrl(req);
  const nonce = generateNonce();

  const params = JSON.stringify({ redirect_uri, state, client_id });

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>连接钱包 — Meme Coin MCP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #fff; font-family: monospace;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1a1a1a; border-radius: 16px; padding: 40px; max-width: 420px; width: 100%; text-align: center; }
    h1 { font-size: 48px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin-bottom: 8px; }
    p  { color: #888; font-size: 14px; margin-bottom: 24px; }
    button { background: #f0a500; color: #000; border: none; border-radius: 8px;
             padding: 14px 32px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
    button:hover { background: #ffb700; }
    button:disabled { background: #555; cursor: not-allowed; }
    .status { margin-top: 16px; font-size: 13px; color: #888; min-height: 20px; }
    .error  { color: #f55; }
  </style>
</head>
<body>
<div class="card">
  <h1>💩</h1>
  <h2>连接钱包以使用 Claude Mint</h2>
  <p>签名一条消息来证明你是钱包持有者。<br>这不会产生任何 gas 费用。</p>
  <button id="btn" onclick="signIn()">🦊 用钱包签名</button>
  <div class="status" id="status"></div>
</div>
<script>
const NONCE  = ${JSON.stringify(nonce)};
const PARAMS = ${JSON.stringify({ redirect_uri, state, client_id })};
const BASE   = ${JSON.stringify(base)};

async function signIn() {
  const btn = document.getElementById('btn');
  const status = document.getElementById('status');
  try {
    if (!window.ethereum) throw new Error('未检测到钱包，请安装 MetaMask');
    btn.disabled = true;
    status.textContent = '请求钱包地址...';
    const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });

    const { SiweMessage } = await import('https://cdn.jsdelivr.net/npm/siwe@2/dist/siwe.umd.js');
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: '登录 Meme Coin MCP，授权 Claude 代你铸造代币。',
      uri: window.location.origin,
      version: '1',
      chainId: parseInt(chainId, 16),
      nonce: NONCE,
    });
    const msg = message.prepareMessage();
    status.textContent = '请在钱包中签名...';
    const signature = await window.ethereum.request({ method: 'personal_sign', params: [msg, address] });

    status.textContent = '验证中...';
    const resp = await fetch(BASE + '/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, signature, ...PARAMS }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error);

    status.textContent = '✅ 验证成功，正在跳转...';
    const url = new URL(PARAMS.redirect_uri);
    url.searchParams.set('code', data.code);
    if (PARAMS.state) url.searchParams.set('state', PARAMS.state);
    window.location.href = url.toString();
  } catch (e) {
    btn.disabled = false;
    status.innerHTML = '<span class="error">❌ ' + e.message + '</span>';
  }
}
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
