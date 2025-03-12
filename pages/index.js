// pages/index.js

import { useMemo } from "react";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { mainnet, localhost } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import LotteryDapp from "../components/LotteryDapp";
import Header from "../components/Header"; // Add this import
import { AppProvider } from "../context/context";

const { chains, publicClient } = configureChains(
  [baseSepolia],
  [
    publicProvider({
      rpcUrl:
        "https://base-sepolia.g.alchemy.com/v2/ObApA1yoGgnk1RPYX6wHs29J6WDYYbNa",
    }),
  ]
);

const config = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  publicClient,
});

export default function Home() {
  return (
    <WagmiConfig config={config}>
      <AppProvider>
        <div className="relative min-h-screen">
          <Header /> {/* Add Header here */}
          <LotteryDapp />
        </div>
      </AppProvider>
    </WagmiConfig>
  );
}
