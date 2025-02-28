import { createContext, useContext, useMemo, useState, useEffect } from "react";
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import idl from "../utils/idl.json";

const SolanaContext = createContext({});

const programID = new PublicKey("3yRy8B1E1pd5FxpuGe72s6tjEAD6v52hq81Kb2U3dpCg");
const MASTER_SEED = "master";
const LOTTERY_SEED = "lottery";
const TICKET_SEED = "ticket";

export const SolanaProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [currentLottery, setCurrentLottery] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [winners, setWinners] = useState([]);
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [lotteryId, setLotteryId] = useState(null);

  const program = useMemo(() => {
    if (wallet?.publicKey) {
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
      );
      return new anchor.Program(idl, programID, provider);
    }
  }, [connection, wallet]);

  const getMasterAddress = async () => {
    const [masterAddress] = await PublicKey.findProgramAddressSync(
      [Buffer.from(MASTER_SEED)],
      programID
    );
    return masterAddress;
  };

  const getLotteryAddress = async (lotteryId) => {
    const [lotteryAddress] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from(LOTTERY_SEED),
        new anchor.BN(lotteryId).toArrayLike(Buffer, "le", 4),
      ],
      programID
    );
    return lotteryAddress;
  };

  const getTicketAddress = async (lotteryAddress, ticketId) => {
    const [ticketAddress] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from(TICKET_SEED),
        lotteryAddress.toBuffer(),
        new anchor.BN(ticketId).toArrayLike(Buffer, "le", 4),
      ],
      programID
    );
    return ticketAddress;
  };

  const createLottery = async (ticketPrice) => {
    try {
      const masterAddress = await getMasterAddress();
      const master = await program.account.master.fetch(masterAddress);
      const nextLotteryId = master.lastId + 1;
      const [lotteryAddress] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from(LOTTERY_SEED),
          new anchor.BN(nextLotteryId).toArrayLike(Buffer, "le", 4),
        ],
        programID
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

      await fetchCurrentLottery();
    } catch (error) {
      console.error("Error creating lottery:", error);
      throw error;
    }
  };

  const buyTicket = async (lotteryId) => {
    try {
      const lotteryAddress = await getLotteryAddress(lotteryId);
      const lottery = await program.account.lottery.fetch(lotteryAddress);
      const nextTicketId = lottery.lastTicketId + 1;
      const [ticketAddress] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from(TICKET_SEED),
          lotteryAddress.toBuffer(),
          new anchor.BN(nextTicketId).toArrayLike(Buffer, "le", 4),
        ],
        programID
      );

      await program.methods
        .buyTicket(new anchor.BN(lotteryId))
        .accounts({
          lottery: lotteryAddress,
          ticket: ticketAddress,
          buyer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await fetchTickets(lotteryId);
    } catch (error) {
      console.error("Error buying ticket:", error);
      throw error;
    }
  };

  const pickWinner = async (lotteryId) => {
    try {
      const lotteryAddress = await getLotteryAddress(lotteryId);

      await program.methods
        .pickWinner(new anchor.BN(lotteryId))
        .accounts({
          lottery: lotteryAddress,
          authority: wallet.publicKey,
        })
        .rpc();

      await fetchCurrentLottery();
    } catch (error) {
      console.error("Error picking winner:", error);
      throw error;
    }
  };

  const claimPrize = async (lotteryId, ticketId) => {
    try {
      const lotteryAddress = await getLotteryAddress(lotteryId);
      const ticketAddress = await getTicketAddress(lotteryAddress, ticketId);

      await program.methods
        .claimPrize(new anchor.BN(lotteryId), new anchor.BN(ticketId))
        .accounts({
          lottery: lotteryAddress,
          ticket: ticketAddress,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await fetchCurrentLottery();
    } catch (error) {
      console.error("Error claiming prize:", error);
      throw error;
    }
  };

  const fetchCurrentLottery = async () => {
    try {
      const masterAddress = await getMasterAddress();
      const master = await program.account.master.fetch(masterAddress);
      const lotteryAddress = await getLotteryAddress(master.lastId);
      const lottery = await program.account.lottery.fetch(lotteryAddress);
      setCurrentLottery(lottery);
      setLotteryId(master.lastId);
    } catch (error) {
      console.error("Error fetching current lottery:", error);
    }
  };

  const fetchTickets = async (lotteryId) => {
    try {
      const lotteryAddress = await getLotteryAddress(lotteryId);
      const tickets = await program.account.ticket.all([
        {
          memcmp: {
            offset: 4,
            bytes: lotteryId.toString(),
          },
        },
      ]);
      setTickets(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchLotteryHistory = async () => {
    const history = [];
    if (!lotteryId) return;

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

  useEffect(() => {
    if (program) {
      fetchCurrentLottery();
      if (lotteryId) {
        fetchLotteryHistory();
      }
    }
  }, [program, lotteryId]);

  return (
    <SolanaContext.Provider
      value={{
        program,
        currentLottery,
        tickets,
        winners,
        lotteryHistory, // Now this is part of the context
        createLottery,
        buyTicket,
        pickWinner,
        claimPrize,
        fetchCurrentLottery,
        fetchTickets,
        fetchLotteryHistory, // Add this function to the context
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
};

export const useSolana = () => useContext(SolanaContext);
