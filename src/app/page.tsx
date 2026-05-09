"use client";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { bsc } from "wagmi/chains";
import { ABI, CONTRACT_ADDRESS, getMintTypedData } from "@/lib/contract";
import { useSignTypedData } from "wagmi";

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const [status, setStatus]       = useState("");
  const [signature, setSignature] = useState("");

  // ── 读取合约数据 ──────────────────────────────────────────────────────────
  const { data: mintPrice }   = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "mintPrice" });
  const { data: totalSupply } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "totalSupply" });
  const { data: maxSupply }   = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "MAX_SUPPLY" });
  const { data: balance }     = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: deposit }     = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "deposits",  args: address ? [address] : undefined });
  const { data: nonce }       = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "nonces",    args: address ? [address] : undefined });

  // ── 存入 BNB ─────────────────────────────────────────────────────────────
  const { writeContract, data: writeTxHash } = useWriteContract();
  const { isLoading: isDepositing } = useWaitForTransactionReceipt({ hash: writeTxHash });

  function handleDeposit() {
    if (!mintPrice) return;
    writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "deposit", value: mintPrice });
    setStatus("存款交易已发送，等待确认...");
  }

  // ── 签名授权 ──────────────────────────────────────────────────────────────
  const { signTypedDataAsync } = useSignTypedData();

  async function handleSign() {
    if (!address || nonce === undefined) return;
    try {
      setStatus("请在钱包中确认签名...");
      const typedData = getMintTypedData(
        CONTRACT_ADDRESS,
        chainId ?? bsc.id,
        address,
        nonce,
        process.env.NEXT_PUBLIC_APP_NAME || "MemeCoin"
      );
      const sig = await signTypedDataAsync(typedData);
      setSignature(sig);
      setStatus("");
    } catch {
      setStatus("❌ 签名取消");
    }
  }

  const priceDisplay   = mintPrice   ? formatEther(mintPrice)   : "...";
  const balDisplay     = balance     ? formatEther(balance)     : "0";
  const depositDisplay = deposit     ? formatEther(deposit)     : "0";
  const hasDeposit     = deposit !== undefined && mintPrice !== undefined && deposit >= mintPrice;
  const supplyPct      = (totalSupply && maxSupply)
    ? ((Number(formatEther(totalSupply)) / Number(formatEther(maxSupply))) * 100).toFixed(2)
    : "0";
  const MCP_URL = "https://meme-coin-mcp-production.up.railway.app";
  const claudeUrl = `https://claude.ai/settings/connectors?add=${encodeURIComponent(MCP_URL)}`;

  return (
    <>
      {/* 顶部导航栏 */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #222",
      }}>
        <span style={{ fontWeight: "bold", fontSize: 18 }}>
          💩 {process.env.NEXT_PUBLIC_APP_NAME || "MemeCoin"}
        </span>
        <ConnectButton />
      </nav>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "100px 20px 40px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 64, margin: 0 }}>💩</h1>
          <h2 style={{ fontSize: 28, margin: "8px 0" }}>
            {process.env.NEXT_PUBLIC_APP_NAME || "MemeCoin"}
          </h2>
          <p style={{ color: "#888", margin: 0 }}>sign once · claude mints · to the moon</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          {[
            ["Mint 价格", `${priceDisplay} BNB`],
            ["进度", `${supplyPct}%`],
            ["我的余额", `${balDisplay} 枚`],
            ["我的存款", `${depositDisplay} BNB`],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#1a1a1a", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: "#666", fontSize: 12 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 未连接钱包提示 */}
        {!isConnected && (
          <div style={{ textAlign: "center", color: "#555", padding: "40px 0", fontSize: 15 }}>
            连接钱包后开始 Mint
          </div>
        )}

        {/* 已连接：Mint 流程 */}
        {isConnected && (
          <Section title="通过 Claude Mint">
            <Steps>
              {/* 第一步：存款 */}
              <Step
                num="①"
                label={`存入 ${priceDisplay} BNB`}
                done={hasDeposit}
                doneLabel="已存款 ✓"
              >
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 10px" }}>
                  预存 BNB，Relayer 会用这笔钱帮你支付 Mint 费用。
                </p>
                <Button onClick={handleDeposit} disabled={isDepositing || hasDeposit}>
                  {isDepositing ? "交易中..." : hasDeposit ? "已存款 ✓" : `存入 ${priceDisplay} BNB`}
                </Button>
              </Step>

              {/* 第二步：签名 */}
              <Step
                num="②"
                label="签名授权"
                done={!!signature}
                doneLabel="已签名 ✓"
              >
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 10px" }}>
                  在钱包中签名（免 gas），授权 Claude 代你 Mint。
                </p>
                <Button onClick={handleSign} disabled={!hasDeposit || !!signature}>
                  {signature ? "已签名 ✓" : "签名授权"}
                </Button>
              </Step>

              {/* 第三步：去 Claude */}
              <Step num="③" label="连接 Claude 开始 Mint">
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 10px" }}>
                  点击按钮，在 Claude 里添加本项目的连接器，然后对 Claude 说「mint me some shit」。
                </p>
                <a
                  href={claudeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    background: signature ? "#cc4400" : "#2a2a2a",
                    color: signature ? "#fff" : "#555",
                    padding: "12px 28px",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: 15,
                    textDecoration: "none",
                    pointerEvents: signature ? "auto" : "none",
                  }}
                >
                  🤖 Connect to Claude →
                </a>
              </Step>
            </Steps>

            {status && (
              <div style={{ marginTop: 12, padding: 10, background: "#111", borderRadius: 8, color: "#aaa", fontSize: 13 }}>
                {status}
              </div>
            )}
          </Section>
        )}

        {/* MCP 配置说明 */}
        <Section title="配置 Claude MCP">
          <p style={{ color: "#888", fontSize: 13 }}>
            在 Claude Desktop 的 <code>claude_desktop_config.json</code> 中添加：
          </p>
          <pre style={{ background: "#111", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto", color: "#aaa" }}>
{`{
  "mcpServers": {
    "meme-coin": {
      "command": "node",
      "args": ["C:/Users/PC/meme-coin/mcp-server/dist/index.js"],
      "env": {
        "RELAYER_URL": "http://localhost:3001",
        "RELAYER_API_KEY": "${process.env.NEXT_PUBLIC_APP_NAME || "你设置的key"}"
      }
    }
  }
}`}
          </pre>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>;
}

function Step({ num, label, done, doneLabel, children }: {
  num: string; label: string; done?: boolean; doneLabel?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: done ? "#1a4a1a" : "#2a2a2a",
        border: `2px solid ${done ? "#0f0" : "#444"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: "bold", color: done ? "#0f0" : "#888",
      }}>
        {done ? "✓" : num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 6, color: done ? "#0f0" : "#fff" }}>
          {done && doneLabel ? doneLabel : label}
        </div>
        {!done && children}
      </div>
    </div>
  );
}

function Button({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#2a2a2a" : "#f0a500",
        color: disabled ? "#555" : "#000",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "bold",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}
