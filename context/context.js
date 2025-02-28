import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { BN } from "@project-serum/anchor";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import toast from "react-hot-toast";
import * as anchor from "@project-serum/anchor";

import {
  getLotteryAddress,
  getMasterAddress,
  getProgram,
  getTicketAddress,
  getTotalPrize,
} from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [masterAddress, setMasterAddress] = useState();
  const [lotteryAddress, setLotteryAddress] = useState();
  const [lottery, setLottery] = useState();
  const [lotteryPot, setLotteryPot] = useState();
  const [lotteryPlayers, setPlayers] = useState([]);
  const [lotteryId, setLotteryId] = useState();
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [userWinningId, setUserWinningId] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [intialized, setIntialized] = useState(false);
  const [userTicketHistory, setUserTicketHistory] = useState([]);

  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (connection) {
      return getProgram(connection, wallet ?? mockWallet());
    }
  }, [connection, wallet]);

  useEffect(() => {
    updateState();
  }, [program]);

  useEffect(() => {
    if (!lottery) return;
    getPot();
    getPlayers();
    getHistory();
    fetchTickets();
    fetchUserTicketHistory();
  }, [lottery]);

  const updateState = async () => {
    if (!program) return;
    try {
      if (!masterAddress) {
        const masterAddress = await getMasterAddress();
        setMasterAddress(masterAddress);
      }
      const master = await program.account.master.fetch(
        masterAddress ?? (await getMasterAddress())
      );
      setIntialized(true);
      setLotteryId(master.lastId);
      const lotteryAddress = await getLotteryAddress(master.lastId);
      setLotteryAddress(lotteryAddress);
      const lottery = await program.account.lottery.fetch(lotteryAddress);
      setLottery(lottery);

      if (!wallet?.publicKey) return;
      const userTickets = await program.account.ticket.all([
        {
          memcmp: {
            bytes: bs58.encode(
              new BN(master.lastId).toArrayLike(Buffer, "le", 4)
            ),
            offset: 12,
          },
        },
        { memcmp: { bytes: wallet.publicKey.toBase58(), offset: 16 } },
      ]);

      // Set userWinningId if user has the winning ticket
      const userWin = userTickets.some(
        (t) => t.account.id === lottery.winnerId
      );
      setUserWinningId(userWin ? lottery.winnerId : null);
    } catch (err) {
      console.error(err.message);
    }
  };

  const createLottery = async (ticketPrice) => {
    try {
      const master = await program.account.master.fetch(masterAddress);
      const nextLotteryId = master.lastId + 1;
      const [lotteryAddress] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from("lottery"),
          new anchor.BN(nextLotteryId).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      await program.methods
        .createLottery(new anchor.BN(ticketPrice))
        .accounts({
          lottery: lotteryAddress,
          master: masterAddress,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await updateState();
    } catch (error) {
      console.error("Error creating lottery:", error);
      throw error;
    }
  };

  const buyTicket = async () => {
    if (!lottery) return;
    try {
      const nextTicketId = lottery.lastTicketId + 1;
      const ticketAddress = await getTicketAddress(
        lotteryAddress,
        nextTicketId
      );

      await program.methods
        .buyTicket(new BN(lotteryId))
        .accounts({
          lottery: lotteryAddress,
          ticket: ticketAddress,
          buyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchTickets();
      await updateState();
    } catch (error) {
      console.error("Error buying ticket:", error);
      throw error;
    }
  };

  const pickWinner = async () => {
    try {
      await program.methods
        .pickWinner(new BN(lotteryId))
        .accounts({
          lottery: lotteryAddress,
          authority: wallet.publicKey,
        })
        .rpc();

      await updateState();
    } catch (error) {
      console.error("Error picking winner:", error);
      throw error;
    }
  };

  const claimPrize = async () => {
    if (!lottery || !userWinningId) return;

    try {
      const txHash = await program.methods
        .claimPrize(new BN(lotteryId), new BN(userWinningId))
        .accounts({
          lottery: lotteryAddress,
          ticket: await getTicketAddress(lotteryAddress, userWinningId),
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await confirmTx(txHash, connection);

      await updateState();
      toast.success("Prize claimed successfully!");
    } catch (error) {
      console.error("Error claiming prize:", error);
      toast.error(error.message);
    }
  };

  const getPot = async () => {
    const pot = getTotalPrize(lottery);
    setLotteryPot(pot);
  };

  const getPlayers = async () => {
    const players = [lottery.lastTicketId];
    setPlayers(players);
  };

  const fetchTickets = async () => {
    if (!program || !lotteryId) {
      console.log("Missing dependencies:", { program: !!program, lotteryId });
      return;
    }

    try {
      console.log("Fetching tickets for lottery:", lotteryId);
      const tickets = await program.account.ticket.all();
      console.log("All tickets:", tickets);

      const filteredTickets = tickets.filter(
        (ticket) => ticket.account.lotteryId === lotteryId
      );
      console.log("Filtered tickets:", filteredTickets);

      setTickets(filteredTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const getHistory = async () => {
    if (!lotteryId) return;

    const history = [];
    for (const i in new Array(lotteryId).fill(null)) {
      const id = lotteryId - parseInt(i);
      if (!id) break;

      const lotteryAddress = await getLotteryAddress(id);
      const lottery = await program.account.lottery.fetch(lotteryAddress);
      const winnerId = lottery.winnerId;
      if (!winnerId) continue;

      const ticketAddress = await getTicketAddress(lotteryAddress, winnerId);
      const ticket = await program.account.ticket.fetch(ticketAddress);

      history.push({
        lotteryId: id,
        winnerId,
        winnerAddress: ticket.authority,
        prize: getTotalPrize(lottery),
      });
    }

    setLotteryHistory(history);
  };

  const fetchUserTicketHistory = async () => {
    if (!program || !wallet?.publicKey) return;

    try {
      // Get all user tickets for all lotteries
      const allUserTickets = await program.account.ticket.all([
        { memcmp: { bytes: wallet.publicKey.toBase58(), offset: 16 } },
      ]);

      setUserTicketHistory(allUserTickets);
    } catch (error) {
      console.error("Error fetching user ticket history:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isMasterInitialized: intialized,
        connected: wallet?.publicKey ? true : false,
        isLotteryAuthority:
          wallet && lottery && wallet.publicKey.equals(lottery.authority),
        lotteryId,
        lottery,
        lotteryPot,
        lotteryPlayers,
        lotteryHistory,
        tickets,
        isFinished: lottery && lottery.winnerId,
        canClaim: lottery && !lottery.claimed && userWinningId,
        error,
        success,
        intialized,
        createLottery,
        buyTicket,
        pickWinner,
        fetchTickets,
        getHistory,
        userTicketHistory,
        userWinningId,
        claimPrize,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
