import React, { useEffect } from "react";
import { Ticket, Trophy, Coins } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";

import { Sparkles } from "lucide-react";
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);
import { useAppContext } from "../context/context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const LotteryDisplay = ({
  wallet,
  lottery,
  tickets,
  userWinningId,
  isLotteryAuthority,
  handleBuyTicket,
  handlePickWinner,
  handleClaimPrize,
}) => {
  if (!wallet.connected) {
    return null;
  }

  // Check if user has any tickets for this lottery
  const userHasTickets = tickets?.some(
    (ticket) =>
      ticket.account.authority.toString() === wallet.publicKey.toString()
  );
  console.log("Tickets:", tickets);

  const prize =
    lottery && lottery.ticketPrice && lottery.lastTicketId
      ? ((lottery.ticketPrice * lottery.lastTicketId) / 1000000000).toFixed(2)
      : "0.00";

  if (lottery?.winnerId) {
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

  // If lottery is still ongoing (no winner picked yet)
  return (
    <div className="flex gap-3">
      <button
        onClick={handleBuyTicket}
        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Buy Ticket ({(lottery?.ticketPrice / 1000000000).toFixed(2)} SOL)
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
  const wallet = useWallet();
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
    userTicketHistory,
    fetchTickets,
    getHistory,
  } = useAppContext();

  const [loadingDots, setLoadingDots] = React.useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  // Add this useEffect after your existing one
  useEffect(() => {
    if (!lottery || !wallet?.publicKey) return;
    fetchTickets();
    getHistory();
  }, [lottery, wallet?.publicKey]);

  const handleCreateLottery = async () => {
    try {
      await createLottery(1000000000);
    } catch (error) {
      console.error("Error creating lottery:", error);
    }
  };

  const handleBuyTicket = async () => {
    try {
      await buyTicket();
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  const handlePickWinner = async () => {
    try {
      await pickWinner();
    } catch (error) {
      console.error("Error picking winner:", error);
    }
  };

  const handleClaimPrize = async () => {
    try {
      await claimPrize();
    } catch (error) {
      console.error("Error claiming prize:", error);
    }
  };

  const shortenPk = (pk) => {
    if (!pk) return "";
    const pkString = pk.toString();
    return `${pkString.slice(0, 4)}...${pkString.slice(-4)}`;
  };

  const userTicket =
    tickets && lottery?.winnerId
      ? tickets.find(
          (ticket) =>
            ticket.account.authority.toString() ===
              wallet.publicKey?.toString() &&
            ticket.account.id === lottery.winnerId
        )
      : null;

  // const userWinningId = userTicket?.account?.id || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <header className="sticky top-0 z-50 transition-all duration-300 bg-gradient-to-r from-black/80 to-black/90 backdrop-blur-lg border-b border-blue-900/50">
        <div className="relative overflow-hidden w-full mx-auto px-6 py-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
          </div>

          {/* Main content */}
          <div className="flex justify-between items-center relative z-10">
            {/* Logo section */}
            <div className="group cursor-pointer">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Coins className="w-8 h-8 text-yellow-400 animate-bounce" />
                  <Sparkles
                    className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-spin"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
                <h1 className="text-4xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Soltery
                  </span>
                </h1>
              </div>
              <p className="text-blue-300 text-sm mt-1 transform transition-all group-hover:translate-x-2">
                Your ticket to decentralized fortune
              </p>
            </div>

            {/* Wallet Button */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition-all" />
              <div className="relative">
                <WalletMultiButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8">
        {/* All cards in one row */}
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
                      Pot:{" "}
                      {lottery
                        ? (
                            (lottery.ticketPrice * lottery.lastTicketId) /
                            1000000000
                          ).toFixed(2)
                        : "0"}{" "}
                      SOL
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-600/40 text-blue-200">
                      {lottery?.winnerId ? "Completed" : "Active"}
                    </span>
                  </div>

                  <LotteryDisplay
                    wallet={wallet}
                    lottery={lottery}
                    tickets={tickets}
                    userWinningId={userWinningId}
                    isLotteryAuthority={isLotteryAuthority}
                    handleBuyTicket={handleBuyTicket}
                    handlePickWinner={handlePickWinner}
                    handleClaimPrize={claimPrize}
                  />
                </div>
              </CardContent>
            </Card>

            {wallet.connected && (
              <Card className="mt-6 bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl">
                <CardHeader className="border-b border-blue-900/20">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Coins className="w-6 h-6 text-emerald-400" />
                    Create New Lottery
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <button
                    onClick={handleCreateLottery}
                    disabled={lottery && !lottery.winnerId}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Create New Lottery
                  </button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Performance & Analytics */}
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
              {wallet.connected ? (
                <>
                  <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-500/20 mb-4">
                    <div className="text-indigo-300 text-sm">Total Tickets</div>
                    <div className="text-2xl font-bold text-white">
                      {(() => {
                        const historicalTickets =
                          userTicketHistory?.length || 0;
                        const currentTickets =
                          tickets?.filter(
                            (ticket) =>
                              ticket.account.authority.toString() ===
                              wallet.publicKey?.toString()
                          ).length || 0;
                        return historicalTickets + currentTickets;
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-500/20">
                      <div className="text-indigo-300 text-sm">Tickets Won</div>
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          const winningTickets =
                            lotteryHistory?.filter(
                              (h) =>
                                h.winnerAddress.toString() ===
                                wallet.publicKey?.toString()
                            ).length || 0;
                          return winningTickets;
                        })()}
                      </div>
                    </div>
                    <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/20">
                      <div className="text-purple-300 text-sm">Win Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          const totalTickets = userTicketHistory?.length || 0;
                          const winningTickets =
                            lotteryHistory?.filter(
                              (h) =>
                                h.winnerAddress.toString() ===
                                wallet.publicKey?.toString()
                            ).length || 0;
                          return totalTickets > 0
                            ? `${(
                                (winningTickets / totalTickets) *
                                100
                              ).toFixed(1)}%`
                            : "0%";
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={lotteryHistory?.map((h) => ({
                          time: `#${h.lotteryId}`,
                          netGain:
                            h.winnerAddress.toString() ===
                            wallet.publicKey?.toString()
                              ? parseFloat(h.prize)
                              : -1 * (lottery?.ticketPrice / 1000000000),
                          isWin:
                            h.winnerAddress.toString() ===
                            wallet.publicKey?.toString(),
                          prize: h.prize,
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
                                      Won: {data.prize} SOL
                                    </p>
                                  ) : (
                                    <p className="text-red-400">
                                      Lost:{" "}
                                      {(
                                        lottery?.ticketPrice / 1000000000
                                      ).toFixed(2)}{" "}
                                      SOL
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

          {/* My Ticket History */}
          <Card className="bg-black/40 backdrop-blur border border-blue-900/20 shadow-xl h-[600px] flex flex-col">
            <CardHeader className="border-b border-blue-900/20 flex-none">
              <CardTitle className="flex items-center gap-2 text-white">
                My Ticket History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-950/50 border border-blue-800/20 rounded-lg p-4">
                {wallet.connected && (
                  <div className="space-y-3">
                    {(() => {
                      const allTickets = [
                        ...(tickets?.filter(
                          (ticket) =>
                            ticket.account.authority.toString() ===
                            wallet.publicKey?.toString()
                        ) || []),
                        ...(lotteryHistory
                          ?.filter(
                            (h) =>
                              h.winnerAddress.toString() ===
                              wallet.publicKey?.toString()
                          )
                          .map((h) => ({
                            account: {
                              id: h.winnerId,
                              lotteryId: h.lotteryId,
                              authority: wallet.publicKey,
                            },
                            historical: true,
                            prize: h.prize,
                          })) || []),
                      ];

                      return allTickets
                        .sort(
                          (a, b) =>
                            b.account.lotteryId - a.account.lotteryId ||
                            b.account.id - a.account.id
                        )
                        .map((ticket, idx) => {
                          const isWinningTicket =
                            lottery?.winnerId === ticket.account.id ||
                            (ticket.historical && ticket.prize);
                          const potentialPrize = ticket.historical
                            ? ticket.prize
                            : (lottery?.ticketPrice * lottery?.lastTicketId) /
                              1000000000;

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
                                      Lottery #{ticket.account.lotteryId} -
                                      Ticket #{ticket.account.id}
                                      {ticket.historical ? " (Past)" : ""}
                                    </p>
                                    {isWinningTicket && (
                                      <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-full">
                                        Winner!
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-400 text-sm mt-1">
                                    {ticket.historical
                                      ? `Won: ${ticket.prize} SOL`
                                      : `Potential Prize: ${potentialPrize?.toFixed(
                                          2
                                        )} SOL`}
                                  </p>
                                </div>
                                {isWinningTicket &&
                                  !ticket.historical &&
                                  lottery &&
                                  !lottery.claimed && (
                                    <button
                                      onClick={() =>
                                        claimPrize(
                                          lottery.id,
                                          ticket.account.id
                                        )
                                      }
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                      Claim Prize
                                    </button>
                                  )}
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overall Lottery History */}
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
                  {lotteryHistory && lotteryHistory.length > 0 ? (
                    lotteryHistory.map((h, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-4 gap-4 py-3 text-center text-blue-100"
                      >
                        <div>#{h.lotteryId}</div>
                        <div>{shortenPk(h.winnerAddress)}</div>
                        <div>#{h.winnerId}</div>
                        <div>{h.prize} SOL</div>
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
