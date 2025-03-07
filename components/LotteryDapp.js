// components/LotteryDapp.js

import React, { useEffect } from "react";
import { Ticket, Trophy, Coins } from "lucide-react";
import { useAccount } from "wagmi";
import { useAppContext } from "../context/context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatEther } from "../utils/helper";

const LotteryDisplay = ({
  isConnected,
  lottery,
  tickets,
  userWinningId,
  isLotteryAuthority,
  handleBuyTicket,
  handlePickWinner,
  handleClaimPrize,
}) => {
  if (!isConnected) return null;

  const userHasTickets = tickets.some((t) => t.owner === useAccount().address);
  const prize = lottery ? formatEther(lottery.totalPrize) : "0.00";

  if (lottery?.winnerChosen) {
    const userHasWinningTicket = userWinningId === lottery.winnerId;

    if (userHasWinningTicket && !lottery.claimed) {
      return (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 font-semibold mb-2">
              Congratulations! You won this lottery!
            </p>
            <button
              onClick={handleClaimPrize}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Claim Prize
            </button>
          </div>
        </div>
      );
    } else if (userHasWinningTicket && lottery.claimed) {
      return (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 font-semibold mb-2">
              You won this lottery, and you have successfully claimed your
              prize!
            </p>
          </div>
        </div>
      );
    } else if (!userHasWinningTicket && !lottery.claimed && userHasTickets) {
      return (
        <div className="space-y-4">
          <div className="bg-red-900/30 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-center">
              You lost this lottery. Better luck next time.
            </p>
            <p className="text-red-300 text-sm text-center mt-2">
              Winning ticket #{lottery.winnerId}
            </p>
          </div>
        </div>
      );
    } else if (!userHasWinningTicket && lottery.claimed && userHasTickets) {
      return (
        <div className="space-y-4">
          <div className="bg-red-900/30 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-center">
              The winner has already claimed their prize.
            </p>
          </div>
        </div>
      );
    } else if (!userHasTickets) {
      return (
        <div className="space-y-4">
          <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-4">
            <p className="text-red-500 text-center font-bold">
              Lottery Closed!
            </p>
            <p className="text-white text-sm text-center mt-2">
              You did not participate in this lottery.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleBuyTicket}
        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Buy Ticket ({formatEther(lottery?.ticketPrice)} ETH)
      </button>
      {isLotteryAuthority && (
        <button
          onClick={handlePickWinner}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Pick Winner
        </button>
      )}
    </div>
  );
};

const LotteryDapp = () => {
  const { address, isConnected } = useAccount();
  const {
    lottery,
    tickets,
    userWinningId,
    lotteryHistory,
    isLotteryAuthority,
    createLottery,
    buyTicket,
    pickWinner,
    claimPrize,
    lotteryPot,
  } = useAppContext();

  const [loadingDots, setLoadingDots] = React.useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const shortenPk = (pk) => (pk ? `${pk.slice(0, 4)}...${pk.slice(-4)}` : "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <main className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <Card className="bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl">
              <CardHeader className="border-b border-blue-900/20">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Ticket className="w-6 h-6 text-blue-400" />
                  Current Lottery{" "}
                  <span className="text-green-400">
                    #{lottery?.id || `${loadingDots}`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-blue-950/50 border border-blue-800/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      Pot: {lotteryPot} ETH
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-600/40 text-blue-200">
                      {lottery?.winnerChosen ? "Completed" : "Active"}
                    </span>
                  </div>
                  <LotteryDisplay
                    isConnected={isConnected}
                    lottery={lottery}
                    tickets={tickets}
                    userWinningId={userWinningId}
                    isLotteryAuthority={isLotteryAuthority}
                    handleBuyTicket={buyTicket}
                    handlePickWinner={pickWinner}
                    handleClaimPrize={claimPrize}
                  />
                </div>
              </CardContent>
            </Card>
            {isConnected && (
              <Card className="mt-6 bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl">
                <CardHeader className="border-b border-blue-900/20">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Coins className="w-6 h-6 text-emerald-400" />
                    Create New Lottery
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <button
                    onClick={createLottery}
                    disabled={lottery && !lottery.winnerChosen}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Create New Lottery
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
          <Card className="bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl h-[600px] flex flex-col">
            <CardHeader className="border-b border-blue-900/20 flex-none">
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-6 h-6 text-amber-400" />
                Performance & Analytics
              </CardTitle>
              <CardDescription className="text-blue-300">
                Your ticket win/loss history and performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              {isConnected ? (
                <>
                  <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-500/20 mb-4">
                    <div className="text-indigo-300 text-sm">Total Tickets</div>
                    <div className="text-2xl font-bold text-white">
                      {tickets.length + lotteryHistory.length}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-500/20">
                      <div className="text-indigo-300 text-sm">Tickets Won</div>
                      <div className="text-2xl font-bold text-white">
                        {
                          lotteryHistory.filter((h) => h.authority === address)
                            .length
                        }
                      </div>
                    </div>
                    <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/20">
                      <div className="text-purple-300 text-sm">Win Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {tickets.length > 0
                          ? `${(
                              (lotteryHistory.filter(
                                (h) => h.authority === address
                              ).length /
                                tickets.length) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={lotteryHistory.map((h) => ({
                          time: `#${h.id}`,
                          netGain:
                            h.authority === address
                              ? parseFloat(formatEther(h.totalPrize))
                              : -0.01,
                          isWin: h.authority === address,
                          prize: formatEther(h.totalPrize),
                          ticketId: h.winnerId,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                        <XAxis
                          dataKey="time"
                          stroke="#60a5fa"
                          tick={{ fill: "#60a5fa" }}
                        />
                        <YAxis stroke="#60a5fa" tick={{ fill: "#60a5fa" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e1b4b",
                            border: "none",
                            borderRadius: "0.5rem",
                            padding: "0.5rem",
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                  <p className="text-blue-400">
                                    Lottery {data.time}
                                  </p>
                                  <p className="text-sm text-slate-300">
                                    Ticket #{data.ticketId}
                                  </p>
                                  {data.isWin ? (
                                    <p className="text-green-400">
                                      Won: {data.prize} ETH
                                    </p>
                                  ) : (
                                    <p className="text-red-400">
                                      Lost: 0.01 ETH
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="netGain"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          dot={{
                            stroke: "#4f46e5",
                            strokeWidth: 2,
                            r: 4,
                            fill: ({ isWin }) =>
                              isWin ? "#4ade80" : "#ef4444",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-4">
                  Connect your wallet to view ticket stats
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl h-[600px] flex flex-col">
            <CardHeader className="border-b border-blue-900/20 flex-none">
              <CardTitle className="flex items-center gap-2 text-white">
                My Ticket History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-950/50 border border-blue-800/20 rounded-lg p-4">
                {isConnected && (
                  <div className="space-y-3">
                    {tickets.map((ticket, idx) => {
                      const isWinningTicket = lottery?.winnerId === ticket.id;
                      return (
                        <div
                          key={idx}
                          className={`${
                            isWinningTicket
                              ? "bg-amber-900/30"
                              : "bg-slate-800/30"
                          } p-4 rounded-lg border ${
                            isWinningTicket
                              ? "border-amber-500/20"
                              : "border-slate-700"
                          } hover:border-blue-500/30 transition-all`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <p
                                  className={`${
                                    isWinningTicket
                                      ? "text-amber-400"
                                      : "text-blue-400"
                                  } text-sm font-medium`}
                                >
                                  Lottery #{ticket.lotteryId} - Ticket #
                                  {ticket.id}
                                </p>
                                {isWinningTicket && (
                                  <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-full">
                                    Winner!
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-sm mt-1">
                                Prize: {lotteryPot} ETH
                              </p>
                            </div>
                            {isWinningTicket && !lottery.claimed && (
                              <button
                                onClick={claimPrize}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                              >
                                Claim Prize
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl h-[600px] flex flex-col">
            <CardHeader className="border-b border-blue-900/20 flex-none">
              <CardTitle className="flex items-center gap-2 text-white">
                Overall Lottery History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-950/50 border border-blue-800/20 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 py-3 text-sm font-semibold text-center text-blue-200 border-b border-blue-800/20 sticky top-0 bg-blue-950/50 backdrop-blur">
                  <div>Lottery ID</div>
                  <div>Winner</div>
                  <div>Winning Ticket</div>
                  <div>Prize</div>
                </div>
                <div className="divide-y divide-blue-800/20">
                  {lotteryHistory.length > 0 ? (
                    lotteryHistory.map((h, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-4 gap-4 py-3 text-center text-blue-100"
                      >
                        <div>#{h.id}</div>
                        <div>{shortenPk(h.authority)}</div>
                        <div>#{h.winnerId}</div>
                        <div>{formatEther(h.totalPrize)} ETH</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-blue-300">
                      No lottery history available.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LotteryDapp;
