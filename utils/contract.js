// utils/program.js

import { ethers } from "ethers";
import { LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI } from "./constants";

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(
    LOTTERY_CONTRACT_ADDRESS,
    LOTTERY_ABI,
    providerOrSigner
  );
};

export const getLotteryInfo = async (provider, lotteryId) => {
  const contract = getContract(provider);
  const info = await contract.getLotteryInfo(lotteryId);
  return {
    id: info.id.toString(),
    authority: info.authority,
    ticketPrice: info.ticketPrice.toString(),
    lastTicketId: info.lastTicketId.toString(),
    winnerId: info.winnerId.toString(),
    winnerChosen: info.winnerChosen,
    claimed: info.claimed,
    totalPrize: info.totalPrize.toString(),
  };
};

export const getTicketInfo = async (provider, lotteryId, ticketId) => {
  const contract = getContract(provider);
  const [id, lottery, owner] = await contract.getTicketInfo(
    lotteryId,
    ticketId
  );
  return { id: id.toString(), lotteryId: lottery.toString(), owner };
};

export const getTotalPrize = (lottery) => {
  return ethers.utils.formatEther(lottery.lastTicketId * lottery.ticketPrice);
};
