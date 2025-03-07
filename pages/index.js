// pages/index.js

import { useMemo } from "react";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { mainnet, localhost } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import LotteryDapp from "../components/LotteryDapp";
import { AppProvider } from "../context/context";

const { chains, publicClient } = configureChains(
  [localhost], // Switch to Sepolia/mainnet later
  [publicProvider()]
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
          <LotteryDapp />
        </div>
      </AppProvider>
    </WagmiConfig>
  );
}
