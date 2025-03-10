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
      console.log("Creating lottery with address:", address);
      const contract = getContract(signer);
      console.log("Got contract with address:", contract.address);

      toast.loading("Checking roles...");

      // Check if user is participant
      console.log("Checking if user is participant");
      const isUserParticipant = await contract.isParticipant(address);
      console.log("Is participant:", isUserParticipant);

      if (!isUserParticipant) {
        console.log("Assigning participant role");
        toast.loading("Assigning participant role...");
        const txRole = await contract.assignRole(address, "participant");
        await txRole.wait();
        toast.success("Participant role assigned!");
      }

      // Check if user is authority
      console.log("Checking if user is authority");
      const isUserAuthority = await contract.isAuthority(address);
      console.log("Is authority:", isUserAuthority);

      if (!isUserAuthority) {
        console.log("Not authority, checking if owner");
        const ownerAddress = await contract.owner();
        console.log("Owner address:", ownerAddress);
        console.log("Current address:", address);

        if (ownerAddress.toLowerCase() !== address.toLowerCase()) {
          toast.error("Only the owner can create lotteries initially");
          return;
        }

        console.log("Is owner, assigning authority role");
        const txRole = await contract.assignRole(address, "authority");
        await txRole.wait();
        toast.success("Authority role assigned!");
      }

      console.log("Creating lottery with ticket price 0.01 ETH");
      toast.loading("Creating lottery...");
      const tx = await contract.createLottery(parseEther("0.01"));
      console.log("Create Tx hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Create Tx confirmed in block:", receipt.blockNumber);
      toast.success("Lottery created!");
      await updateState();
    } catch (err) {
      console.error("Create lottery error:", err);
      toast.error(
        "Failed to create lottery: " + (err.message || JSON.stringify(err))
      );
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
