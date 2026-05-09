import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Meme Coin",
  description: "Sign once. Claude mints.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#fff", fontFamily: "monospace" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
