// components/Header.js

import React, { useState, useEffect } from "react";
import { Sparkles, Coins } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [sparklePosition, setSparklePosition] = useState({ x: 0, y: 0 });
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSparklePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-lg"
          : "bg-gradient-to-r from-purple-900 to-blue-900 backdrop-blur-sm"
      }`}
      onMouseMove={handleMouseMove}
    >
      <div className="relative overflow-hidden">
        {/* <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl animate-pulse delay-1000" />
        </div> */}
        <div className="max-w-7xl mx-auto px-6 py-4 relative">
          <div className="flex justify-between items-center">
            <div className="group cursor-pointer">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Coins className="w-8 h-8 text-yellow-400 animate-bounce" />
                  <Sparkles
                    className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-spin"
                    style={{ "--tw-animate-duration": "3s" }}
                  />
                </div>
                <h1 className="text-4xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
                    DrawBox
                  </span>
                </h1>
              </div>
              <p className="text-blue-300 text-sm mt-1 transform transition-all group-hover:translate-x-2">
                Your ticket to decentralized fortune
              </p>
            </div>
            <button
              onClick={() => connect({ connector: new MetaMaskConnector() })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {isConnected
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </div>
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>
    </header>
  );
};

export default Header;
