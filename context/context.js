// context/context.js

/* eslint-disable react-hooks/exhaustive-deps */
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
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
  const refreshState = () => updateState();
  const [lotteryId, setLotteryId] = useState(0);
  const [lottery, setLottery] = useState(null);
  const [lotteryPot, setLotteryPot] = useState("0");
  const [tickets, setTickets] = useState([]);
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [userWinningId, setUserWinningId] = useState(null);
  const [userTicketHistory, setUserTicketHistory] = useState([]);

  const { address, isConnected } = useAccount();
  const signer = isConnected
    ? new ethers.providers.Web3Provider(window.ethereum).getSigner()
    : null;
  // Use JsonRpcProvider for better reliability
  // const provider = new ethers.providers.JsonRpcProvider(
  //   "http://127.0.0.1:8545"
  // );

  const provider = useMemo(
    () => new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545"),
    []
  );

  const assignParticipantRole = async () => {
    try {
      // Only attempt if connected
      if (!isConnected || !signer) {
        toast.error("Please connect your wallet first");
        return;
      }
      const contract = getContract(signer);
      // Attempt to call getCurrentAuthority first
      try {
        const authority = await contract.getCurrentAuthority();
        const tx = await contract.assignRole(address, "participant");
        await tx.wait();
        toast.success("Participant role assigned!");
        await updateState(); // Refresh state after role assignment
      } catch (error) {
        // Try using requestRole instead
        const tx = await contract.requestRole("participant");
        await tx.wait();
        toast.success("Role requested successfully!");
        await updateState();
      }
    } catch (err) {
      toast.error("Failed to assign participant role: " + err.message);
      console.error(err);
    }
  };

  const updateState = useCallback(async () => {
    if (!provider) {
      console.log("No provider available");
      return;
    }
    try {
      const contract = getContract(provider);
      const currentIdBN = await contract.lotteryIdCounter();
      const currentId = Number(currentIdBN);
      setLotteryId(currentId);

      if (currentId === 0) {
        console.log("No lotteries yet—resetting state");
        setLottery(null);
        setLotteryPot("0");
        setTickets([]);
        setUserWinningId(null);
        return;
      }

      const lotteryData = await getLotteryInfo(provider, currentId);
      setLottery(lotteryData);

      // Fix lotteryPot calculation (see overflow fix below)
      setLotteryPot(ethers.utils.formatEther(lotteryData.totalPrize));

      const ticketPromises = [];
      for (let i = 1; i <= Number(lotteryData.lastTicketId); i++) {
        ticketPromises.push(getTicketInfo(provider, currentId, i));
      }
      const fetchedTickets = await Promise.all(ticketPromises);
      // console.log("Fetched tickets:", fetchedTickets);
      setTickets(fetchedTickets.filter(Boolean)); // Filter out undefined tickets

      const userTicket = fetchedTickets.find((t) => t.owner === address);
      if (userTicket && userTicket.id === lotteryData.winnerId) {
        setUserWinningId(userTicket.id);
      } else {
        setUserWinningId(null);
      }

      const historyPromises = [];
      for (let i = 1; i < currentId; i++) {
        historyPromises.push(getLotteryInfo(provider, i));
      }
      const history = await Promise.all(historyPromises);
      setLotteryHistory(history.filter((h) => h.winnerChosen));
    } catch (err) {
      console.error("Update state failed:", err);
    }
  }, [provider, address]);

  useEffect(() => {
    if (!isConnected || !signer) return;
    updateState();
  }, [isConnected, signer]);

  const createLottery = async () => {
    try {
      const contract = getContract(signer);
      console.log("Creating lottery on contract:", contract.address);
      // Check if user is authority first
      const isUserAuthority = await contract.isAuthority(address);
      if (!isUserAuthority) {
        const txRole = await contract.assignRole(address, "authority");
        await txRole.wait();
        toast.success("Authority role assigned!");
      }
      const tx = await contract.createLottery(parseEther("0.01"));
      console.log("Create Tx hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Create Tx confirmed in block:", receipt.blockNumber);
      toast.success("Lottery created!");
      await updateState();
    } catch (err) {
      toast.error("Failed to create lottery: " + err.message);
      console.error(err);
    }
  };

  const buyTicket = async () => {
    if (!lotteryId || lotteryId === 0) {
      toast.error("No active lottery—create one first!");
      return;
    }
    try {
      const contract = getContract(signer);
      console.log("Buying ticket on contract:", contract.address);
      const tx = await contract.buyTicket(lotteryId, {
        value: parseEther("0.01"),
      });
      console.log("Buy Tx hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Buy Tx confirmed in block:", receipt.blockNumber);
      toast.success("Ticket purchased!");
      await updateState();
    } catch (err) {
      toast.error("Failed to buy ticket: " + err.message);
      console.error(err);
    }
  };

  const pickWinner = async () => {
    try {
      const contract = getContract(signer);
      const tx = await contract.pickWinner(lotteryId);
      await tx.wait();
      toast.success("Winner picked!");
      await updateState(); // Force refresh
    } catch (err) {
      toast.error("Failed to pick winner: " + err.message);
    }
  };

  const claimPrize = async () => {
    try {
      const contract = getContract(signer);
      const tx = await contract.claimPrize(lotteryId, userWinningId);
      await tx.wait();
      toast.success("Prize claimed!");
      await updateState(); // Force refresh
    } catch (err) {
      toast.error("Failed to claim prize: " + err.message);
    }
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
        refreshState,
        assignParticipantRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
