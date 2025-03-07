// context/context.js

import { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { useAccount, useSigner } from "wagmi";
import toast from "react-hot-toast";
import {
  getContract,
  getLotteryInfo,
  getTicketInfo,
  getTotalPrize,
  parseEther,
} from "../utils/contract";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lotteryId, setLotteryId] = useState(0);
  const [lottery, setLottery] = useState(null);
  const [lotteryPot, setLotteryPot] = useState("0");
  const [tickets, setTickets] = useState([]);
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [userWinningId, setUserWinningId] = useState(null);
  const [userTicketHistory, setUserTicketHistory] = useState([]);

  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const provider = ethers.providers.getDefaultProvider("http://127.0.0.1:8545"); // Hardhat node

  useEffect(() => {
    if (!isConnected || !signer) return;
    updateState();
  }, [isConnected, signer]);

  const updateState = async () => {
    try {
      const contract = getContract(provider);
      const currentId = await contract.lotteryIdCounter();
      setLotteryId(currentId.toString());

      const lotteryData = await getLotteryInfo(provider, currentId);
      setLottery(lotteryData);
      setLotteryPot(getTotalPrize(lotteryData));

      // Fetch tickets (simplified for now, expand with KRNL later)
      const ticketPromises = [];
      for (let i = 1; i <= lotteryData.lastTicketId; i++) {
        ticketPromises.push(getTicketInfo(provider, currentId, i));
      }
      const fetchedTickets = await Promise.all(ticketPromises);
      setTickets(fetchedTickets);

      // Check if user is winner
      const userTicket = fetchedTickets.find((t) => t.owner === address);
      if (userTicket && userTicket.id === lotteryData.winnerId) {
        setUserWinningId(userTicket.id);
      }

      // History (simplified, fetch all past lotteries)
      const historyPromises = [];
      for (let i = 1; i < currentId; i++) {
        historyPromises.push(getLotteryInfo(provider, i));
      }
      const history = await Promise.all(historyPromises);
      setLotteryHistory(history.filter((h) => h.winnerChosen));
    } catch (err) {
      console.error(err);
    }
  };

  const createLottery = async () => {
    const contract = getContract(signer);
    const tx = await contract.createLottery(parseEther("0.01"));
    await tx.wait();
    toast.success("Lottery created!");
    updateState();
  };

  const buyTicket = async () => {
    const contract = getContract(signer);
    const tx = await contract.buyTicket(lotteryId, {
      value: parseEther("0.01"),
    });
    await tx.wait();
    toast.success("Ticket purchased!");
    updateState();
  };

  const pickWinner = async () => {
    const contract = getContract(signer);
    const tx = await contract.pickWinner(lotteryId);
    await tx.wait();
    toast.success("Winner picked!");
    updateState();
  };

  const claimPrize = async () => {
    const contract = getContract(signer);
    const tx = await contract.claimPrize(lotteryId, userWinningId);
    await tx.wait();
    toast.success("Prize claimed!");
    updateState();
  };

  return (
    <AppContext.Provider
      value={{
        connected: isConnected,
        isLotteryAuthority: lottery?.authority === address,
        lotteryId,
        lottery,
        lotteryPot,
        tickets,
        lotteryHistory,
        userWinningId,
        userTicketHistory,
        isFinished: lottery?.winnerChosen,
        canClaim: lottery && !lottery.claimed && userWinningId,
        createLottery,
        buyTicket,
        pickWinner,
        claimPrize,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
