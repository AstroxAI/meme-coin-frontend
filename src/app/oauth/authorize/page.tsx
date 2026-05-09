"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiweMessage } from "siwe";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function AuthorizeInner() {
  const searchParams = useSearchParams();
  const redirect_uri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const client_id = searchParams.get("client_id") || "";

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      if (!window.ethereum) throw new Error("未检测到钱包，请安装 MetaMask");

      setStatus("请求钱包地址...");
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;

      setStatus("获取 nonce...");
      const nonceRes = await fetch("/oauth/nonce");
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "登录 Meme Coin MCP，授权 Claude 代你铸造代币。",
        uri: window.location.origin,
        version: "1",
        chainId: parseInt(chainIdHex, 16),
        nonce,
      });
      const msg = message.prepareMessage();

      setStatus("请在钱包中签名...");
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [msg, address],
      })) as string;

      setStatus("验证中...");
      const resp = await fetch("/oauth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, signature, redirect_uri, state, client_id }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      setStatus("✅ 验证成功，正在跳转...");
      const url = new URL(redirect_uri);
      url.searchParams.set("code", data.code);
      if (state) url.searchParams.set("state", state);
      window.location.href = url.toString();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "未知错误");
      setStatus("");
      setBusy(false);
    }
  }

  return (
    <div style={{
      background: "#0a0a0a", color: "#fff", fontFamily: "monospace",
      display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh",
    }}>
      <div style={{
        background: "#1a1a1a", borderRadius: 16, padding: 40,
        maxWidth: 420, width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💩</div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>连接钱包以使用 Claude Mint</h2>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
          签名一条消息来证明你是钱包持有者。<br />这不会产生任何 gas 费用。
        </p>
        <button
          onClick={signIn}
          disabled={busy}
          style={{
            background: busy ? "#555" : "#f0a500",
            color: busy ? "#999" : "#000",
            border: "none", borderRadius: 8,
            padding: "14px 32px", fontSize: 16, fontWeight: "bold",
            cursor: busy ? "not-allowed" : "pointer", width: "100%",
          }}
        >
          🦊 用钱包签名
        </button>
        {status && (
          <div style={{ marginTop: 16, fontSize: 13, color: "#888" }}>{status}</div>
        )}
        {error && (
          <div style={{ marginTop: 16, fontSize: 13, color: "#f55" }}>❌ {error}</div>
        )}
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense>
      <AuthorizeInner />
    </Suspense>
  );
}
