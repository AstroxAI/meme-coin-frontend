import { createHmac, randomBytes } from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
export const RELAYER_URL = process.env.RELAYER_URL || "http://localhost:3001";
export const RELAYER_API_KEY = process.env.RELAYER_API_KEY || "";

export function getBaseUrl(req: Request): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// Stateless nonce: 16-char hex timestamp + 16-char hex random + 16-char hex hmac = 48 chars
export function generateNonce(): string {
  const ts = Date.now().toString(16).padStart(16, "0");
  const rand = randomBytes(8).toString("hex");
  const data = ts + rand;
  const hmac = createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("hex")
    .slice(0, 16);
  return data + hmac;
}

export function verifyNonce(nonce: string): boolean {
  if (nonce.length !== 48 || !/^[0-9a-f]+$/.test(nonce)) return false;
  const ts = parseInt(nonce.slice(0, 16), 16);
  const data = nonce.slice(0, 32);
  const hmac = nonce.slice(32);
  const expected = createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("hex")
    .slice(0, 16);
  if (hmac !== expected) return false;
  if (Date.now() - ts > 5 * 60 * 1000) return false;
  return true;
}

export function issueCode(address: string): string {
  return jwt.sign({ address, t: "code" }, JWT_SECRET, { expiresIn: "10m" });
}

export function redeemCode(code: string): string {
  const p = jwt.verify(code, JWT_SECRET) as { address: string; t: string };
  if (p.t !== "code") throw new Error("invalid code");
  return p.address;
}

export function issueToken(address: string): string {
  return jwt.sign({ address, scope: "token_mint" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export function verifyBearerToken(authHeader: string | null): string {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("unauthorized");
  const p = jwt.verify(authHeader.slice(7), JWT_SECRET) as { address: string };
  return p.address;
}

export async function relayerGet(path: string) {
  const res = await fetch(`${RELAYER_URL}${path}`);
  return res.json();
}

export async function relayerPost(path: string, body: object) {
  const res = await fetch(`${RELAYER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": RELAYER_API_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
