import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  phantomWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  okxWallet,
} from "@rainbow-me/rainbowkit/wallets";

const connectors = connectorsForWallets(
  [
    {
      groupName: "常用钱包",
      wallets: [
        metaMaskWallet,
        trustWallet,
        okxWallet,
        phantomWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Meme Coin",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  }
);

export const config = createConfig({
  connectors,
  chains: [bscTestnet, bsc],
  transports: {
    [bsc.id]:        http("https://bsc-dataseed.binance.org/"),
    [bscTestnet.id]: http("https://bsc-testnet-rpc.publicnode.com"),
  },
  ssr: true,
});
